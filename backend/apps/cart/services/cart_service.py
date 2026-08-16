from apps.products.models import Inventory


class CartService:

    @staticmethod
    def get_inventory(variant):
        """
        Phase-03:
            Return inventory for the given variant.

        Future (Multi-Vendor):
            Select the best vendor inventory automatically
            based on business rules (stock, priority, location,
            pricing, etc.).
        """

        return Inventory.objects.filter(
            variant=variant
        ).first()