(function () {
  function formatMoney(cents) {
    var currency = document.body.dataset.currency || "USD";
    var locale = document.documentElement.lang || "en";
    try {
      return new Intl.NumberFormat(locale, {
        style: "currency",
        currency: currency
      }).format(cents / 100);
    } catch (error) {
      return (cents / 100).toFixed(2);
    }
  }

  function bindProduct(root) {
    var data = root.querySelector("[data-variant-json]");
    var idInput = root.querySelector("[data-variant-id]");
    if (!data || !idInput) return;

    var variants;
    try {
      variants = JSON.parse(data.textContent);
    } catch (error) {
      return;
    }

    var selects = root.querySelectorAll("[data-option]");
    var price = root.querySelector("[data-price]");
    var compare = root.querySelector("[data-compare]");
    var stock = root.querySelector("[data-stock]");
    var button = root.querySelector("[data-add]");

    function render(variant) {
      if (!variant) {
        if (button) {
          button.disabled = true;
          button.textContent = "Unavailable";
        }
        return;
      }
      idInput.value = variant.id;
      if (price) price.textContent = formatMoney(variant.price);
      if (compare) {
        var onSale = variant.compare_at_price && variant.compare_at_price > variant.price;
        compare.hidden = !onSale;
        if (onSale) compare.textContent = formatMoney(variant.compare_at_price);
      }
      if (stock) {
        stock.textContent = variant.available ? "In stock" : "Sold out";
        stock.classList.toggle("stock--in", variant.available);
      }
      if (button) {
        button.disabled = !variant.available;
        button.textContent = variant.available ? "Add to cart" : "Sold out";
      }
    }

    function match() {
      var chosen = Array.prototype.map.call(selects, function (select) {
        return select.value;
      });
      var variant = variants.find(function (item) {
        return chosen.every(function (value, index) {
          return item.options[index] === value;
        });
      });
      render(variant);
    }

    selects.forEach(function (select) {
      select.addEventListener("change", match);
    });
  }

  function bindSort(form) {
    var select = form.querySelector("select");
    if (!select) return;
    select.addEventListener("change", function () {
      form.submit();
    });
  }

  function start() {
    document.querySelectorAll("[data-product]").forEach(bindProduct);
    document.querySelectorAll("[data-sort]").forEach(bindSort);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
