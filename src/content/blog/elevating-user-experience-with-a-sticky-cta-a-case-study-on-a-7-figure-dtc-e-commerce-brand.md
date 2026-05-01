---
title: "Elevating User Experience with a Sticky CTA: A Case Study on a 7-Figure DTC e-commerce brand"
description: "In the ever-evolving world of e-commerce and CRO, optimizing the user experience is crucial for driving conversions and boosting revenue. At DTC Pages (the company I work for), we’re all about push…"
pubDate: 2024-07-02
updatedDate: 2025-07-08
tags: ["cro", "case-study", "shopify"]
---
In the ever-evolving world of e-commerce and CRO, optimizing the user experience is crucial for driving conversions and boosting revenue. At [DTC Pages](https://www.dtcpages.com/) (the company I work for), we’re all about pushing the boundaries of web development and creating innovative solutions for our clients. Recently, we had the pleasure of working with a brand to implement a sticky Call to Action (CTA) button on their product template. The results? Well, let’s say they were nothing short of amazing!

### The Challenge

We faced a common e-commerce dilemma: **how can we improve the user journey on their product pages and increase conversion rates?** We wanted to make it easier for customers to add products to their cart without having to scroll back up to find the “Add to Cart” button.

### Our Approach

We decided to create a sticky CTA button that would follow users as they scrolled down the product page. This meant that no matter where they were on the page, **the option to add the product to their cart was always within reach**. Here’s a step-by-step breakdown of what we did:

1.  1.  **Research and Planning**: We analyzed the current product pages and user behavior. This helped us understand the key touchpoints where users would most likely drop off.

1.  1.  **Design and Development**: Using Liquid, HTML, CSS, and JavaScript, we designed a sleek, unobtrusive, sticky CTA button seamlessly integrated with the existing theme. The button was positioned so it didn’t interfere with the product images or descriptions.

1.  1.  **Testing and Implementation**: We conducted _A/B tests_ to measure the impact of the sticky CTA on user engagement and conversions. This involved creating two versions of the product page: one with the sticky Call To Action and one without.

### Technical Implementation

Regarding the technical implementation (**my main work on this CRO Experiment**), I wanted to provide a bit more information because, you know, I love to share my contributions with _the Dev/Shopify community_ and the best possible development standards.

One of the first things we like to do in [DTC Pages](https://www.dtcpages.com/) is separate all our code implementations into specific global Shopify Liquid, JS, and CSS files that we can reference as snippets. This way, if an experiment wins, it’s easier for us to deploy or remove our code, as well as a better control versioning (this was a helpful idea a partner of mine in [DTC Pages](https://www.dtcpages.com/) shared a time ago. Cheers, [Hemnys Chacón](https://www.linkedin.com/in/hemnys-chacon/)).

The implementation was as follows:

**– I needed to include a** snippet file at the bottom which would contain the content for our CTA sticky button. This file was included right before </body> end, in order to place it on top of everything in the DOM.

```
{%- if template contains "product" -%}
	{% render "dtc-sticky-cta" %}
{%- endif -%}
```

**– I added the content to the** dtc-sticky-cta.liquid**.** This file contains the HTML elements necessary to display the floating button and what would be handled by our JS code.

```
<div id="sticky-add-to-cart" class="sticky-add-to-cart hidden">
    <h5 id="sticky-product-title" class="sticky-product-title"></h5>
    <button id="sticky-add-to-cart-button" class="sticky-add-to-cart-button"></button>
</div>
```

**– I added the Javascript code that handles the elements in the floating button and their containers.** The code below provides functions to effectively show a sticky “Add to Cart” button as users scroll past the original button on the page. This JS content needs to be added to an independent file, preferably.

```
document.addEventListener('DOMContentLoaded', function() {
    // Cache DOM elements that will be used multiple times throughout the script.
    const $stickyAddToCart = document.getElementById('sticky-add-to-cart');
    const $stickyAddToCartButton = document.getElementById('sticky-add-to-cart-button');
    const $originalProductName = document.querySelector('.product__title > h1');
    const $stickyProductName = document.getElementById('sticky-product-title');
    const $addToCartButton = document.getElementById('add-to-cart-btn');

    // Check if all critical elements are present before setting up the event listeners.
    if (!$addToCartButton || !$originalProductName || !$stickyAddToCart || !$stickyAddToCartButton) {
        console.warn('Critical elements not found; required for sticky Add to Cart functionality.');
        return;  // Exit if any element is missing to prevent runtime errors.
    }

    // Variables for managing throttled scroll event.
    let lastKnownScrollPosition = 0;
    let ticking = false;

    // Function to handle the sticky Add to Cart logic based on scroll position.
    function handleScroll() {
        const rect = $addToCartButton.getBoundingClientRect();  // Get the position of the Add to Cart button.

        // Show or hide the sticky Add to Cart bar based on the position of the original Add to Cart button.
        if (rect.top < 0) {
            $stickyProductName.textContent = $originalProductName.textContent;  // Set sticky product name from the original product name.
            $stickyAddToCartButton.textContent = $addToCartButton.textContent;  // Set sticky button text from the original button text.
            $stickyAddToCart.style.display = 'flex';  // Make the sticky Add to Cart visible.
        } else {
            $stickyAddToCart.style.display = 'none';  // Hide the sticky Add to Cart.
        }
    }

    // Set up a throttled scroll event listener using requestAnimationFrame for better performance.
    window.addEventListener('scroll', function(e) {
        lastKnownScrollPosition = window.scrollY;

        // Ensure that handleScroll runs at a controlled rate to avoid performance issues during fast scrolls.
        if (!ticking) {
            window.requestAnimationFrame(function() {
                handleScroll(lastKnownScrollPosition);
                ticking = false;  // Reset the ticking flag to allow the next call in the RAF queue.
            });

            ticking = true;  // Set a flag to indicate that a rAF callback is queued.
        }
    });

    // Add click event listener to the sticky Add to Cart button.
    $stickyAddToCartButton.addEventListener('click', function() {
        $addToCartButton.click();  // Trigger a click event on the original Add to Cart button.
    });
});
```

**– I added the CSS to a separate file.** Since the CSS code is so personalized to this client and its use case, please take only what you consider critical to your implementation.

```
/* Add this code in your CSS file */
.sticky-add-to-cart {
    display: none;
    position: sticky;
    bottom: 0;
    background-color: #F2EFFA;
    padding: 16px 100px;  /* Consider reducing the horizontal padding if not necessary */
    text-align: center;
    justify-content: space-between;
    align-items: center;
    width: 100%;  /* Ensure full width to stick correctly */
    z-index: 1000;  /* High z-index to keep it above other content */
}

.sticky-add-to-cart .sticky-product-title {
    font-family: 'Helvetica', 'Arial', sans-serif;  /* Changed to more common fonts as fallbacks */
    font-weight: bold;  /* Use common keyword for font-weight for better understanding */
    font-size: 24px;
    line-height: 31px;
    color: #003558;
}

.sticky-add-to-cart .sticky-add-to-cart-button {
    padding: 18px 24px;  /* Uniform padding for simplicity */
    background-color: #003558;
    color: #fff;
    border: none;  /* Ensure there's no border unless necessary */
    cursor: pointer;
    font-size: 16px;
    line-height: 22px;
    border-radius: 4px;
    font-weight: 500;
    display: flex;
    justify-content: center;
    align-items: center;  /* Centering content inside the button */
}

/* Remove SVG display rule if not using SVG inside buttons or ensure it is necessary */

@media (max-width: 768px) {
    .sticky-add-to-cart {
        padding: 12px 16px;  /* Reduced padding on smaller screens */
    }

    .sticky-add-to-cart .sticky-product-title {
        display: none;  /* Hide product title on smaller screens to save space */
    }

    .sticky-add-to-cart .sticky-add-to-cart-button {
        width: 100%;  /* Button takes full width on smaller screens */
        padding: 10px 0;  /* Adjust padding for smaller screens */
    }
}
```

**Remember that since this is only a product page implementation, you should use the** {% if product contains “product” %} xxx {% endif %} **validation.** This way, you avoid throwing unnecessary or conflicting code at the other templates and pages.

### The Experiment: Product | Sticky CTA

Our experiment was dubbed “Product | Sticky CTA,” and the results were nothing short of impressive.

**Result**: The sticky CTA button led to a significant increase in the _Conversion Rate_. While we didn’t quite hit statistical significance for _Revenue Per Visitor_, the impact on conversions was undeniable. Assuming all other variables remained constant, the estimated extra monthly transactions from deploying this variant were 121 additional purchases.

### Key Learnings

1.  1.  **Enhanced User Experience**: The sticky Call To Action made it easier for users to add products to their cart, leading to a smoother and more intuitive shopping experience.

1.  1.  **Increased Conversions**: The constant presence of the Call To Action encouraged users to make purchasing decisions more quickly, significantly boosting the _Conversion Rates_.

1.  1.  **Potential for Revenue Growth**: While the _Revenue Per Visitor_ didn’t hit statistical significance, the increase in transactions suggests a strong potential for revenue growth with further optimization.

### Conclusion

Our experiment with this popular Shark Tank-funded e-commerce brand demonstrates the power of a well-placed sticky Call To Action in enhancing user experience and driving conversions.

This case study not only highlights our technical prowess but also our fun, irreverent approach to web development. We believe in making meaningful changes that drive results, all while keeping things light and engaging. So, what’s your next big idea? Let’s make it a reality!
