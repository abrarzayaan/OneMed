from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from apps.products.models.cms import CmsHeroSlide, CmsAnnouncementBar

class CmsHeroSlideListCreateView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        slides = CmsHeroSlide.objects.all()
        data = [
            {
                "id": s.id,
                "title": s.title,
                "subtitle": s.subtitle,
                "badge": s.badge,
                "cta_text": s.cta_text,
                "cta_link": s.cta_link,
                "image_url": s.image_url,
                "is_published": s.is_published,
                "order": s.order,
                "created_at": s.created_at.isoformat() if s.created_at else "",
            }
            for s in slides
        ]
        return Response(data)

    def post(self, request):
        data = request.data
        slide = CmsHeroSlide.objects.create(
            title=data.get("title", "New Slide"),
            subtitle=data.get("subtitle", ""),
            badge=data.get("badge", ""),
            cta_text=data.get("cta_text", "Shop Now"),
            cta_link=data.get("cta_link", "/products"),
            image_url=data.get("image_url", "https://i.ibb.co/Lhb8Z30/hero-default.jpg"),
            is_published=data.get("is_published", True),
            order=data.get("order", 0),
        )
        return Response({
            "id": slide.id,
            "title": slide.title,
            "subtitle": slide.subtitle,
            "badge": slide.badge,
            "cta_text": slide.cta_text,
            "cta_link": slide.cta_link,
            "image_url": slide.image_url,
            "is_published": slide.is_published,
            "order": slide.order,
        }, status=status.HTTP_201_CREATED)


class CmsHeroSlideDetailView(APIView):
    permission_classes = [AllowAny]

    def patch(self, request, pk):
        try:
            slide = CmsHeroSlide.objects.get(pk=pk)
        except CmsHeroSlide.DoesNotExist:
            return Response({"error": "Hero slide not found"}, status=status.HTTP_404_NOT_FOUND)

        for key, val in request.data.items():
            if hasattr(slide, key):
                setattr(slide, key, val)
        slide.save()

        return Response({
            "id": slide.id,
            "title": slide.title,
            "subtitle": slide.subtitle,
            "badge": slide.badge,
            "cta_text": slide.cta_text,
            "cta_link": slide.cta_link,
            "image_url": slide.image_url,
            "is_published": slide.is_published,
            "order": slide.order,
        })

    def delete(self, request, pk):
        try:
            slide = CmsHeroSlide.objects.get(pk=pk)
            slide.delete()
            return Response({"success": True}, status=status.HTTP_204_NO_CONTENT)
        except CmsHeroSlide.DoesNotExist:
            return Response({"error": "Hero slide not found"}, status=status.HTTP_404_NOT_FOUND)


class CmsAnnouncementBarView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        bar, _ = CmsAnnouncementBar.objects.get_or_create(id=1)
        return Response({
            "id": bar.id,
            "text": bar.text,
            "bg_theme": bar.bg_theme,
            "is_visible": bar.is_visible,
        })

    def patch(self, request):
        bar, _ = CmsAnnouncementBar.objects.get_or_create(id=1)
        if "text" in request.data:
            bar.text = request.data["text"]
        if "bg_theme" in request.data:
            bar.bg_theme = request.data["bg_theme"]
        if "is_visible" in request.data:
            bar.is_visible = request.data["is_visible"]
        bar.save()

        return Response({
            "id": bar.id,
            "text": bar.text,
            "bg_theme": bar.bg_theme,
            "is_visible": bar.is_visible,
        })
