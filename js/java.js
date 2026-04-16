let menuBtn = document.querySelector('#menu-btn');
let navbar = document.querySelector('.navbar');

let cartBtn = document.querySelector('#cart-btn');
let cartDropdown = document.querySelector('#cart-dropdown');

menuBtn.onclick = () => {
    navbar.classList.toggle('active');
    cartDropdown.classList.remove('active');
};

cartBtn.onclick = () => {
    cartDropdown.classList.toggle('active');
    navbar.classList.remove('active');
};

window.onscroll = () => {
    navbar.classList.remove('active');
    cartDropdown.classList.remove('active');
};

/* CART LOGIC */

const form = document.querySelector('#ticket-form');
const cartItemsContainer = document.querySelector('.cart-items');
const cartCount = document.querySelector('.cart-count');

let cart = [];

form.addEventListener('submit', function(e){
    e.preventDefault();

    const name = document.querySelector('#full-name').value;
    const age = document.querySelector('#age-category').value;
    const type = document.querySelector('#ticket-type').value;
    const quantity = document.querySelector('#ticket-quantity').value;

    const item = {
        id: Date.now(),
        name,
        age,
        type,
        quantity
    };

    cart.push(item);
    updateCart();
    form.reset();
});

function updateCart(){
    cartItemsContainer.innerHTML = '';

    if(cart.length === 0){
        cartItemsContainer.innerHTML = '<p class="empty-cart">Your cart is empty.</p>';
        cartCount.textContent = '0';
        return;
    }

    let total = 0;

    cart.forEach(item => {
        const div = document.createElement('div');
        div.classList.add('cart-item');

        div.innerHTML = `
            <h4>${item.type}</h4>
            <p>${item.age} • ${item.quantity}x</p>
            <button class="remove-btn" onclick="removeItem(${item.id})">Remove</button>
        `;

        cartItemsContainer.appendChild(div);
        total += Number(item.quantity);
    });

    cartCount.textContent = total;
}

function removeItem(id){
    cart = cart.filter(item => item.id !== id);
    updateCart();
}
