$(document).ready(function () {
    
    // isLogin ?
    let isLogin = $('.header').data('login');
    
    // Add event toggle Like
    toggleLike();

    // Add Notify Some Functions don't exist
    $('.auth-form__social-fb').click(function() {
        InformFunctionNoExist($(this));
    });
    $('.auth-form__social-gg').click(function() {
        InformFunctionNoExist($(this));
    });
    $('.is-updating').click(function(e) {
        e.preventDefault();
        InformFunctionNoExist($(this));
    });

    // Search Products
    $('.header__search-input').keyup(function(e) {
        if ($('#filter-submit').length > 0) {
            $('input[name="search"]').val($('.header__search-input').val());
        }

        if(e.keyCode == 13) {
            $('.header__search-btn').click();
        }
    });
    $('.header__search-btn').click(function() {
        const search = $('.header__search-input').val();
        if (!search.trim()) return -1;

        if ($('#filter-submit').length > 0) return $('#filter-submit').click();

        window.location.href = `/category?search=${search}`;
    });

    // Show search keyword in search bar
    if ($('#filter-submit').length > 0) {
        $('.header__search-input').val($('input[name="search"]').val());
    }

    // Load more when scroll to bottom
    $(window).scroll(function() {
        if ($('#loading').length == 0) return -1;

        let isLoading = $('#loading').data('loading');
        let page = $('#loading').data('page');

        if ($(window).scrollTop() + $(window).height() == $(document).height() && !isLoading) {
            $('#loading').fadeIn('slow');
            $('#loading').data('loading', true);
            
            $.ajax({
                method: 'get',
                url: '/products/load-more',
                data: {
                    page,
                },
                success: (data) => {
                    if (!data.data || data.data.length == 0) return $('#loading').remove();

                    $('#loading').data('page', page + 1);
                    $('#loading').fadeOut('fast');
                    $('#loading').data('loading', false);

                    const products = data.data;
                    const user = data.user;
                    
                    const htmlData = LoadMoreProducts(user, products, 6);
                    $('#all-products').append(htmlData).ready(function() {
                        // if(!user) return;
                        $('.ajax-cart').off('click').click(AddToCart);
                        $('.ajax-liked-product').off('click').click(ChangeLikeProduct);
                        toggleLike();
                    });
                },
            });
        }
    });

    // Checking status the order
    $('.order__check-btn').click(function() {
        const code = $('.order__check-input').val();
        if (!code) return showNotify($(this), 'Vui l??ng nh???p m?? ????n h??ng!', 'warn');
        
        const url = '/orders/' + code;
        $.ajax({
            method: 'get',
            url,
            success: (data) => {
                if (!data || !data.data) return showNotify($(this), '????n h??ng kh??ng t???n t???i!', 'error');

                $('.order_information').css('display', 'block');
                $('.order__status-bar-full').css('width', data.data.status/3*100 + '%');
                $('.order__status-point').each(function() {
                    if ($(this).data('status') <= data.data.status) $(this).addClass('active')
                    else $(this).removeClass('active');
                });
                $('.order_information-code').text(data.data.code);
                $('.order_information-name').text(formatHideHelper(data.data.name));
                $('.order_information-phone').text(formatHideHelper(data.data.phone, 'right'));
                
                showNotify($(this), 'Xem th??ng tin ????n h??ng c???a b???n b??n d?????i!', 'success');
            }
        });
    });

    // Confirm orders
    $('.cart__product-order-btn').click(async function() {
        // const isConfirm = confirm('B???n c?? mu???n thanh to??n?');
        const isConfirm = await Swal.fire(swalConfig('B???n c?? mu???n thanh to??n ????n h??ng?', 'info', '?????ng ??'));
        if (!isConfirm.value) return -1;

        const address = $('input[name="transport_address"]').val();
        const city = $('select[name="transport_city"]').val();
        const fee = $('td.transport-fee').data('fee');
        const discount = $('td.transport-discount').data('discount');
        const discount_id = $('input.product__voucher-unit').data('id');
        const total = $('td.cart__product-checkout-price-total').data('total');
        const products = [];
        $('.cart__product-price-total').each(function() {
            const id = $(this).data('id');
            const quantity = $(this).data('quantity');
            products.push({product: id, quantity});
        });
        const data = {
            address,
            city,
            price: {
                fee,
                discount,
                total,
            },
            products,
            discount_id,
        }
        
        $.ajax({
            method: 'post',
            url: '/orders/add',
            data: {"data": JSON.stringify(data)},
            success: async (data) => {
                await Swal.fire({
                    title: '?????t h??ng th??nh c??ng!', 
                    text: 'M?? ????n h??ng c???a b???n l??: ' + data.code, 
                    icon: 'success',
                    confirmButtonText: "Copy m?? ????n h??ng v?? chuy???n ?????n trang theo d??i ????n h??ng",
                });
                navigator.clipboard.writeText(data.code);
                window.location.pathname = '/orders';
            }
        })
    });

    // Update Total of Checkout price when load pages, change discount, transport
    updateTotalPriceCheckout();

    $('.product__voucher-change').click(function() {
        const discountCode = $('input.product__voucher-unit').val();
        if (!discountCode) return showNotify($(this), 'Vui l??ng nh???p m?? gi???m gi??!', 'warn');
        let url = `/discounts/${discountCode}`;
        $.ajax({
            method: 'get',
            url,
            success: (data) => {
                if (!data.data) return showNotify($(this), 'M?? gi???m gi?? kh??ng h???p l???!', 'error');
                const newPrice = data.data.value;
                
                $('.product__voucher-price').text(formatCurrencyHelper(newPrice));
                $('td.transport-discount').text(formatCurrencyHelper(newPrice));
                $('td.transport-discount').data('discount', newPrice);
                $('input.product__voucher-unit').data('id', data.data._id);
                showNotify($(this), 'C???p nh???t m?? gi???m gi?? th??nh c??ng!');
                updateTotalPriceCheckout();
            },
        });
    });

    $('.transport__destination-change').click(function() {
        const cityId = $('select[name="transport_city"]').val();
        let url = `/deliveries/${cityId}`;

        $.ajax({
            method: 'get',
            url,
            success: (data) => {
                if (!data || !data.data) return alert('C?? l???i khi thay ?????i ?????a ch???!');
                
                const fee = data.data.transport_fee;
                $('td.transport-fee').data('fee', fee);
                $('td.transport-fee').text(formatCurrencyHelper(fee));
                showNotify($(this), 'Thay ?????i ?????a ch??? giao h??nh th??nh c??ng!');
                updateTotalPriceCheckout();
            },
        });
    });
    
    // Go to checkout page when click button buy now
    $('.go-to-checkout').click(function() {
        let href = `/checkouts/${$(this).data('id')}`;
        location.href = href;
    });

    // Delete product from Cart on Cart Page
    $('.ajax-cart-delete').click(function(e) {
        const eleInput = $(this).parents('.product__cart-item').find('input.product__quantity-number');
        const ProductID  = eleInput.data('product-id');
        const CartID  = eleInput.data('cart-id');
        const url = `/carts/delete/${CartID}/${ProductID}`;
        
        $.ajax({
            method: 'get',
            url,
            success: (data) => {
                let quantityTotal = +$('.cart__product-total-quantity').text();
                let priceTotal = $('.cart__product-total-price').data('price');
                let price = $(this).parents('.product__cart-item').find('.cart__product-price-new').data('price');
                let quantity = +eleInput.val();
                priceTotal -= price * quantity;
                quantityTotal -= quantity;
                $(this).parents('.product__cart-item').remove();

                $('.cart__product-total-quantity').text(quantityTotal);
                $('.cart__product-total-price').data('price', priceTotal)
                $('.cart__product-total-price').text(formatCurrencyHelper(priceTotal));
                // $('.header__cart-notice').text(quantityTotal);
                resetCart();
            }
        });
    });

    // Delete Products in Carts on Header
    $('.header__cart-item-delete').click(deleteProductCart);

    // Increase/decrease quantity of product in product pages
    $('.product__quantity-btn').click(ajaxChangeQuantityProduct);
    $('input.product__quantity-number').change(ajaxChangeQuantityProduct);

    // Add to cart
    $('.ajax-cart').click(AddToCart);

    // Add product to Cart On product page
    $('.ajax-add-cart').click(function(e) {
        const element = $(this);
        if (!isLogin) return InformNeedLogin(element);
        const eleInput = $('input.product__quantity-number');
        if (eleInput.val() <= 0) return showNotify($(this), 'Vui l??ng ch???n s??? l?????ng s???n ph???m c???n th??m!', 'error');;

        const ProductID  = eleInput.data('product-id');
        const CartID  = eleInput.data('cart-id');
        const url = `/carts/add/${CartID}/${ProductID}?quantity=${eleInput.val()}`;
        
        $.ajax({
            method: 'get',
            url,
            success: (data) => {
                if (element.hasClass('product__add-cart')) {
                    // updateQuantityProduct(+eleInput.val());
                    eleInput.val(0);
                    showNotify($(this), 'Th??m s???n ph???m v??o gi??? h??ng th??nh c??ng!');
                    resetCart();

                } else if (element.hasClass('product__buy-now')) {
                    window.location.href = '/carts/' + CartID;
                }
            }
        });
    });

    // Change Like Product
    $('.ajax-liked-product').click(ChangeLikeProduct);

    //Sort Product
    $('.home-filter__btn').click(function() {
        const sort_type = $(this).data('sort');
        $('input[name="sort_type"]').val(sort_type);
        $('#form-filter').submit();
    });

    $('.select-input__link').click(function(e) {
        e.preventDefault();
        const sort_type = $(this).data('sort');
        $('input[name="sort_type"]').val(sort_type);
        $('#form-filter').submit();
    });

    // FUNCTION
    function InformNeedLogin(element) {
        if (!isLogin) return showNotify(element, 'B???n c???n ????ng nh???p ????? th???c hi???n thao t??c n??y', 'info');
    }

    function InformFunctionNoExist(element) {
        return showNotify(element, 'Ch???c n??ng n??y ??ang trong qu?? tr??nh ph??t tri???n', 'info');
    }

    function LoadMoreProducts (user, products, column = 6) {
        column = column === 5 ? '2-4' : 12/column;
        if (!user) user = {id: '', cart: ''};
        
        let xhtml = '';
        products.forEach(product => {
            const isLiked   = (typeof user !== 'undefined') ? product.like.user_id.find(id => id == user._id) : -1;
            const likedClass= isLiked ? 'home-product-item__like--liked' : '';
            const price_old = product.price.price_old;
            const price_new = product.price.price_new;
            let percentPrice = (price_old - price_new) / price_old * 100;
            percentPrice = Math.round(percentPrice);
            product.id = product._id;

            xhtml += `<div class="col l-${column} m-3 c-6">
                            <a href="/products/${product.id}" data-id=${product.id} data-link=/products/change-like class="home-product-item">
                                <div class="home-product-item__img" style="background-image:url(${product.thumb});"></div>
                                <h4 class="home-product-item__name">${product.name}</h4>
                                <div class="home-product-item__price">
                                    <span class="home-product-item__price-old">${formatCurrencyHelper(price_old)}</span>
                                    <span class="home-product-item__price-current">${formatCurrencyHelper(price_new)}</span>
                                </div>
                                <div class="home-product-item__action">
                                    <span class="home-product-item__like ajax-liked-product ${likedClass}">
                                        <i class="home-product-item__like-icon far fa-heart"></i>
                                        <i class="home-product-item__liked-icon fas fa-heart"></i>
                                    </span>
                                    <div class="home-product-item__rating">
                                        <i class="home-product-item__start--gold fas fa-star"></i>
                                        <i class="home-product-item__start--gold fas fa-star"></i>
                                        <i class="home-product-item__start--gold fas fa-star"></i>
                                        <i class="fas fa-star"></i>
                                        <i class="fas fa-star"></i>
                                    </div>
                                    <span class="home-product-item__sold">${product.sold} ???? b??n</span>
                                </div>
                                <div class="home-product-item__origin">
                                    <span data-id="${user.cart}" class="home-product-item__brand ajax-cart"><i class="fas fa-cart-plus"></i></span>
                                    <span class="home-product-item__origin-name">${product.group.name}</span>
                                </div>
                                <div class="home-product-item__favourite">
                                    <i class="fas fa-check"></i>
                                    <span>Y??u th??ch</span>
                                </div>
                                <div class="home-product-item__sale-off">
                                    <span class="home-product-item__sale-off-percent">${percentPrice}%</span>
                                    <span class="home-product-item__sale-off-label">GI???M</span>
                                </div>
                            </a>
                        </div>`;
        });

        return xhtml;
    }

    function AddToCart(e) {
        e.preventDefault();
        const element = $(this);
        if (!isLogin) return InformNeedLogin(element);

        const ProductID  = element.closest('.home-product-item').data('id');
        const CartID  = element.data('id');
        const url = `/carts/add/${CartID}/${ProductID}?quantity=1`;

        $.ajax({
            method: 'get',
            url,
            success: (data) => {
                showNotify(element, 'Th??m s???n ph???m v??o gi??? h??ng!');
                // updateQuantityProduct(1);
                resetCart();
            }
        });
    }

    function ChangeLikeProduct(e) {
        e.preventDefault();
        const element = $(this);
        if (!isLogin) return InformNeedLogin(element);
        
        const url = element.closest('.home-product-item').data('link');
        const id  = element.closest('.home-product-item').data('id');

        $.ajax({
            method: 'post',
            url,
            data: {
                id,
            },
            success: (data) => {
                
            }
        });
    }

    function ajaxChangeQuantityProduct() {
        const increase = $(this).data('increase') ? +$(this).data('increase') : 0;
        const eleInput = $(this).parent().find('input.product__quantity-number');
        const valInput = +eleInput.val();
        eleInput.val(valInput + increase < 0 ? 0 : valInput + increase);

        const isCartPage = document.getElementById('product-cart');
        if (!isCartPage) return -1;
        const ProductID  = eleInput.data('product-id');
        const CartID  = eleInput.data('cart-id');
        const url = `/carts/edit/${CartID}/${ProductID}?quantity=${eleInput.val()}`;
        $.ajax({
            method: 'get',
            url,
            success: (data) => {

                const quantity = +eleInput.val();
                const price    = $(this).parents('.product__cart-item')
                                        .find('.cart__product-price-new')
                                        .data('price');
                $(this).parents('.product__cart-item')
                                    .find('.cart__product-price-total')
                                    .text(formatCurrencyHelper(quantity * price));
                let priceTotal = 0;
                let quantityTotal = 0;
                data.data.forEach(item => {
                    quantityTotal += item.quantity;
                    priceTotal += item.product_id.price.price_new * item.quantity;
                });
                $('.cart__product-total-quantity').text(quantityTotal);
                $('.cart__product-total-price').text(formatCurrencyHelper(priceTotal));
                $('.cart__product-total-price').data('price', priceTotal);
                // $('.header__cart-notice').text(quantityTotal);
                resetCart();
            }
        });
    }

    function formatCurrencyHelper(price, unit = '???') {
        let string = price.toString();
        let result = '';
        let count = 0;

        for(let i = string.length - 1; i >= 0; i--) {
            count++;
            result = string[i] + result;
            if (count % 3 === 0 && i > 0) result = '.' + result;
        }
        return result + ' ' + unit;
    }

    function formatHideHelper (text, showPosition = 'left', showLetterNumber = 3) {
        let from = 0;
        let to = text.length - 1;
        if (showPosition === 'left') {
            from += showLetterNumber;
        } else {
            to -= showLetterNumber;
        }
        let string = '';

        for(let i = 0; i < text.length; i++) {
            if (from <= i && i <= to) string += '*'
            else string += text[i];
        }
        return string;
    }

    function updateQuantityProduct(quantity) {
        let quantityTotal = +$('.header__cart-notice').text();
        $('.header__cart-notice').text(quantityTotal + quantity);
    }

    function updateTotalPriceCheckout() {
        const price_original = $('td.transport-price-original').data('price');
        const fee = $('td.transport-fee').data('fee');
        const discount = $('td.transport-discount').data('discount');
        let elePriceTotal = $('td.cart__product-checkout-price-total');
        let priceTotal = price_original + fee - discount;
        elePriceTotal.data('total', priceTotal);
        elePriceTotal.text(formatCurrencyHelper(priceTotal));
    }

    function resetCart() {
        const url = `/carts/get-products/`;
        $.ajax({
            method: 'get',
            url,
            success: (data) => {

                const id = $('.header__cart-list').data('id');
                $('#header__cart-wrap').html(showHtmlCart(data.data, id));
                $('.header__cart-item-delete').click(deleteProductCart);
            }
        });

    }

    function showHtmlCart(cartProducts, cartID) {
        let xhtml = '';
        let quantityTotal = 0;
        if (cartProducts && cartProducts.length > 0) {
            cartProducts.forEach(cartProduct => {
                const product = cartProduct.product_id;
                const quantity = cartProduct.quantity;
                quantityTotal += quantity;

                xhtml += `<li class="header__cart-item" data-id=${product._id}>
                            <img src="${product.thumb}" alt="${product.name}" class="header__cart-img">
                            <div class="header__cart-item-info">
                                <div class="header__cart-item-head">
                                    <h5 class="header__cart-item-name">${product.name}</h5>
                                    <div class="header__cart-item-price-wrap">
                                        <span class="header__cart-item-price">${formatCurrencyHelper(product.price.price_new)}</span>
                                        <span class="header__cart-item-multiply">x</span>
                                        <span class="header__cart-item-quantity">${quantity}</span>
                                    </div>
                                </div>
                                <div class="header__cart-item-body">
                                    <span class="header__cart-item-description"></span>
                                    <span class="header__cart-item-delete">X??a</span>
                                </div>
                            </div>
                        </li>`;
            });

            xhtml = `<h4 class="header__cart-heading">S???n ph???m ???? th??m</h4>
                    <ul class="header__cart-list-item">
                        ${xhtml}
                    </ul>
                    <a href="/carts/${cartID}" class="header__cart-view-cart btn btn--primary">Xem gi??? h??ng</a>`;
        } else {
            xhtml = `<img src="/frontend/img/no_cart.png" alt="Kh??ng c?? s???n ph???m" class="header__cart-empty-img">
                    <span class="header__cart-list-empty-msg">
                        Ch??a c?? s???n ph???m
                    </span>`;
        }

        return `<a style="display: block;" href="/carts/${cartID}"><i class="header__cart-icon fas fa-shopping-cart"></i></a>
                <span class="header__cart-notice">${quantityTotal}</span>
                <div class="header__cart-list" data-id=${cartID}>
                    ${xhtml}
                </div>`;
    }

    function toggleLike() {
        if (!isLogin) return -1;

        const elmLikes = document.querySelectorAll('.home-product-item__like');

        elmLikes.forEach(elm => {
            elm.onclick = (e) => {
                elm.classList.toggle('home-product-item__like--liked')
            }
        });
    }

    // function delete product in cart on header
    function deleteProductCart() {
        const eleProductItem = $(this).parents('.header__cart-item');
        const ProductID  = $(this).parents('.header__cart-item').data('id');
        const CartID  = $('.header__cart-list').data('id');
        const url = `/carts/delete/${CartID}/${ProductID}`;
        
        $.ajax({
            method: 'get',
            url,
            success: (data) => {
                resetCart();

                // Delete product in cart in Cart Page when delete product on header
                if ($('#product-cart').length > 0) {
                    $(`.product__cart-item[data-product-id="${ProductID}"]`).remove();
                };
            }
        });
    }

    //End $ready
});

function showNotify(element, content, status = 'success') {
    element.notify(content, {
        className: status,
        position: 'top center',
        autoHideDelay: 2000,
    });
}

function swalConfig(text, icon, confirmText) {
    return {
        position: 'top',
        title: 'Th??ng b??o!',
        text: text,
        icon: icon,
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: confirmText,
        cancelButtonText: 'H???y',
    };
}

