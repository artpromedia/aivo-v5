"""
S3 Storage Client for IEP Documents
Handles secure file upload and retrieval from S3 or compatible storage.
"""

import os
import uuid
import hashlib
from datetime import datetime, timedelta
from typing import Optional, Tuple, BinaryIO
import logging

try:
    import boto3
    from botocore.exceptions import ClientError
    HAS_BOTO3 = True
except ImportError:
    HAS_BOTO3 = False

logger = logging.getLogger(__name__)


class S3StorageClient:
    """
    S3 Storage client for IEP document uploads.
    Supports S3, MinIO, or other S3-compatible storage.
    """
    
    def __init__(self):
        self.bucket_name = os.getenv("S3_BUCKET_NAME", "aivo-iep-documents")
        self.region = os.getenv("AWS_REGION", "us-east-1")
        self.endpoint_url = os.getenv("S3_ENDPOINT_URL")  # For MinIO/local dev
        
        if HAS_BOTO3:
            session_kwargs = {
                "region_name": self.region,
            }
            if os.getenv("AWS_ACCESS_KEY_ID"):
                session_kwargs["aws_access_key_id"] = os.getenv("AWS_ACCESS_KEY_ID")
                session_kwargs["aws_secret_access_key"] = os.getenv("AWS_SECRET_ACCESS_KEY")
            
            client_kwargs = {}
            if self.endpoint_url:
                client_kwargs["endpoint_url"] = self.endpoint_url
            
            self.s3_client = boto3.client("s3", **session_kwargs, **client_kwargs)
            self.s3_resource = boto3.resource("s3", **session_kwargs, **client_kwargs)
        else:
            self.s3_client = None
            self.s3_resource = None
            logger.warning("boto3 not installed - S3 storage will use mock implementation")
    
    def _generate_key(self, learner_id: str, filename: str) -> str:
        """Generate a unique S3 key for the document."""
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        unique_id = str(uuid.uuid4())[:8]
        safe_filename = "".join(c for c in filename if c.isalnum() or c in "._-")
        return f"iep-documents/{learner_id}/{timestamp}_{unique_id}_{safe_filename}"
    
    async def upload_file(
        self,
        file_content: bytes,
        filename: str,
        learner_id: str,
        content_type: str = "application/pdf",
        metadata: Optional[dict] = None
    ) -> Tuple[str, str]:
        """
        Upload a file to S3.
        
        Returns:
            Tuple of (s3_key, file_url)
        """
        s3_key = self._generate_key(learner_id, filename)
        
        if not self.s3_client:
            # Mock implementation for development
            logger.info(f"Mock upload: {s3_key}")
            return s3_key, f"s3://{self.bucket_name}/{s3_key}"
        
        try:
            extra_args = {
                "ContentType": content_type,
                "ServerSideEncryption": "AES256",  # Encrypt at rest
                "Metadata": metadata or {},
            }
            
            self.s3_client.put_object(
                Bucket=self.bucket_name,
                Key=s3_key,
                Body=file_content,
                **extra_args
            )
            
            # Generate a URL (not presigned, just the S3 path)
            file_url = f"s3://{self.bucket_name}/{s3_key}"
            
            logger.info(f"Successfully uploaded {filename} to {s3_key}")
            return s3_key, file_url
            
        except ClientError as e:
            logger.error(f"Failed to upload to S3: {e}")
            raise Exception(f"Failed to upload document: {str(e)}")
    
    async def get_presigned_url(
        self,
        s3_key: str,
        expiration: int = 3600  # 1 hour
    ) -> str:
        """Generate a presigned URL for secure document access."""
        if not self.s3_client:
            return f"https://mock-s3.example.com/{s3_key}?expires={expiration}"
        
        try:
            url = self.s3_client.generate_presigned_url(
                "get_object",
                Params={
                    "Bucket": self.bucket_name,
                    "Key": s3_key,
                },
                ExpiresIn=expiration
            )
            return url
        except ClientError as e:
            logger.error(f"Failed to generate presigned URL: {e}")
            raise
    
    async def download_file(self, s3_key: str) -> bytes:
        """Download a file from S3."""
        if not self.s3_client:
            logger.warning(f"Mock download: {s3_key}")
            return b""  # Return empty bytes for mock
        
        try:
            response = self.s3_client.get_object(
                Bucket=self.bucket_name,
                Key=s3_key
            )
            return response["Body"].read()
        except ClientError as e:
            logger.error(f"Failed to download from S3: {e}")
            raise
    
    async def delete_file(self, s3_key: str) -> bool:
        """Delete a file from S3."""
        if not self.s3_client:
            logger.info(f"Mock delete: {s3_key}")
            return True
        
        try:
            self.s3_client.delete_object(
                Bucket=self.bucket_name,
                Key=s3_key
            )
            logger.info(f"Deleted {s3_key}")
            return True
        except ClientError as e:
            logger.error(f"Failed to delete from S3: {e}")
            return False
    
    def compute_file_hash(self, content: bytes) -> str:
        """Compute SHA-256 hash of file content for integrity checking."""
        return hashlib.sha256(content).hexdigest()


# Global instance
storage_client = S3StorageClient()
