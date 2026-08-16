import os
import logging
import requests
# pyrefly: ignore [missing-import]
from django.core.files.storage import Storage
# pyrefly: ignore [missing-import]
from django.conf import settings
# pyrefly: ignore [missing-import]
from django.utils.deconstruct import deconstructible

logger = logging.getLogger(__name__)


@deconstructible
class ImgBBStorage(Storage):
    """
    Custom Django Storage Backend for ImgBB API.
    Uploads images directly to ImgBB cloud storage and saves direct HTTPS URLs in DB.
    """

    def __init__(self, api_key=None, upload_url=None):
        self.api_key = api_key or getattr(settings, 'IMGBB_API_KEY', '6ae6f2084f448bf93ad41c4b2c0a2053')
        self.upload_url = upload_url or getattr(settings, 'IMGBB_UPLOAD_URL', 'https://api.imgbb.com/1/upload')

    def _save(self, name, content):
        """
        Uploads content file to ImgBB and returns the direct ImgBB URL.
        """
        if hasattr(content, 'chunks'):
            file_bytes = b''.join(chunk for chunk in content.chunks())
        else:
            file_bytes = content.read()

        filename = os.path.basename(name) or 'uploaded_image.png'

        payload = {'key': self.api_key}
        files = {'image': (filename, file_bytes)}

        try:
            response = requests.post(self.upload_url, data=payload, files=files, timeout=30)
            data = response.json()

            if response.status_code == 200 and data.get('success'):
                direct_url = data['data']['url']
                logger.info(f"Successfully uploaded {filename} to ImgBB: {direct_url}")
                return direct_url
            else:
                err_details = data.get('error', {}).get('message', str(data))
                logger.error(f"ImgBB API error during upload of {filename}: {err_details}")
                raise IOError(f"ImgBB API Upload Failed: {err_details}")
        except Exception as e:
            logger.error(f"ImgBB Exception for {filename}: {e}")
            raise IOError(f"Could not upload image to ImgBB: {str(e)}")

    def url(self, name):
        """
        Returns direct URL of image.
        """
        if not name:
            return ""
        if name.startswith('http://') or name.startswith('https://'):
            return name
        media_url = getattr(settings, 'MEDIA_URL', '/media/')
        if name.startswith(media_url):
            return name
        return f"{media_url.rstrip('/')}/{name.lstrip('/')}"

    def exists(self, name):
        """
        Always return False so Django saves with returned ImgBB URL.
        """
        return False

    def delete(self, name):
        pass

    def size(self, name):
        return 0

    def get_available_name(self, name, max_length=None):
        return name
