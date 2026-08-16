from django.apps import AppConfig

class ProductsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.products'  # তোমার ফুল পাথ অনুযায়ী নিশ্চিত করো

    def ready(self):
        import apps.products.models