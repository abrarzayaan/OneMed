from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework import status
from django.apps import apps
from django.core.paginator import Paginator

class AdminModelExplorerMetadataView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        app_models = []
        target_apps = ['products', 'orders', 'authentication', 'profiles', 'cart', 'coupons']

        for app_label in target_apps:
            try:
                app_config = apps.get_app_config(app_label)
                models_list = []
                for model in app_config.get_models():
                    models_list.append({
                        "model_name": model.__name__,
                        "verbose_name": model._meta.verbose_name.title(),
                        "verbose_name_plural": model._meta.verbose_name_plural.title(),
                        "db_table": model._meta.db_table,
                        "record_count": model.objects.count(),
                    })
                app_models.append({
                    "app_label": app_label,
                    "app_name": app_config.verbose_name.title(),
                    "models": models_list,
                })
            except Exception:
                pass

        return Response(app_models)


class AdminModelExplorerDataView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, app_label, model_name):
        try:
            model = apps.get_model(app_label, model_name)
        except LookupError:
            return Response({"error": f"Model {model_name} in app {app_label} not found"}, status=status.HTTP_404_NOT_FOUND)

        queryset = model.objects.all()
        page = int(request.query_params.get("page", 1))
        page_size = int(request.query_params.get("page_size", 20))

        paginator = Paginator(queryset, page_size)
        current_page = paginator.get_page(page)

        fields_meta = [
            {
                "name": f.name,
                "type": f.get_internal_type(),
                "is_primary_key": f.primary_key,
                "is_nullable": f.null,
            }
            for f in model._meta.get_fields() if hasattr(f, 'get_internal_type')
        ]

        records = []
        for obj in current_page:
            item = {}
            for f in model._meta.get_fields():
                if hasattr(f, 'get_internal_type'):
                    val = getattr(obj, f.name, None)
                    if hasattr(val, 'isoformat'):
                        val = val.isoformat()
                    elif hasattr(val, '__str__') and not isinstance(val, (str, int, float, bool, list, dict, type(None))):
                        val = str(val)
                    item[f.name] = val
            records.append(item)

        return Response({
            "model_name": model_name,
            "app_label": app_label,
            "total_records": paginator.count,
            "total_pages": paginator.num_pages,
            "current_page": page,
            "fields": fields_meta,
            "records": records,
        })
