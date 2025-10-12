# lambda-deletion-worker-deaddropper
import os, json, boto3
from botocore.exceptions import ClientError

REGION = os.environ.get("REGION","eu-north-1")
BUCKET = os.environ["BUCKET_NAME"]
DDB_TABLE = os.environ["DYNAMO_DROPS"]

s3 = boto3.client("s3", region_name=REGION)
dynamodb = boto3.resource("dynamodb", region_name=REGION)
table = dynamodb.Table(DDB_TABLE)

def delete_prefix(bucket, prefix):
    """Delete all objects in S3 under a given prefix."""
    paginator = s3.get_paginator('list_objects_v2')
    to_delete = []
    for page in paginator.paginate(Bucket=bucket, Prefix=prefix):
        for obj in page.get('Contents', []):
            to_delete.append({'Key': obj['Key']})
            if len(to_delete) == 1000:
                s3.delete_objects(Bucket=bucket, Delete={'Objects': to_delete})
                to_delete = []
    if to_delete:
        s3.delete_objects(Bucket=bucket, Delete={'Objects': to_delete})

def lambda_handler(event, context):
    print("DEBUG event:", json.dumps(event))
    try:
        for rec in event.get("Records", []):
            body = rec.get("body")
            try:
                data = json.loads(body)
                drop_id = data.get("drop_id")
                if not drop_id:
                    continue
                prefix = f"drops/{drop_id}/"

                # delete all S3 objects for this drop
                delete_prefix(BUCKET, prefix)

                # mark DynamoDB item as deleted
                table.update_item(
                    Key={"drop_id": drop_id},
                    UpdateExpression="SET #s = :st",
                    ExpressionAttributeNames={"#s":"status"},
                    ExpressionAttributeValues={":st":"deleted"}
                )
                print(f"Deleted drop {drop_id} from S3 and DynamoDB marked as deleted.")
            except Exception as e:
                print("Error processing record:", str(e))
                continue
        return {"statusCode":200}
    except Exception as e:
        print("Fatal error:", str(e))
        return {"statusCode":500, "body": json.dumps({"error": str(e)})}
