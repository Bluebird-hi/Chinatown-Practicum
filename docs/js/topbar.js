
/* button status*/

const buttons = document.querySelectorAll('.nav-btn');

buttons.forEach(btn => {
  btn.addEventListener('click', () => {
    buttons.forEach(b => b.classList.remove('active'));
    if (btn.parentElement.classList.contains('nav-buttons')) {
      btn.classList.add('active');
    }
  });
});

buttons.forEach(btn => {
  btn.addEventListener('click', () => {
    buttons.forEach(b => b.classList.remove('active'));
    if (btn.parentElement.classList.contains('nav-buttons')) {
      btn.classList.add('active');
    }
  });
});
/* scroll down to hide, scroll to show */

let lastScrollTop = 0;
  const navbar = document.querySelector('.navbar');

  window.addEventListener('scroll', () => {
    const scrollTop = window.scrollY;

    // If we're at the top of the page, always show the navbar
    if (scrollTop <= 0) {
      navbar.classList.remove('hidden');
      return;
    }

    // If scrolling down, hide the navbar
    if (scrollTop > lastScrollTop) {
      navbar.classList.add('hidden');
    } 
    // If scrolling up, show the navbar
    else {
      navbar.classList.remove('hidden');
    }

    lastScrollTop = scrollTop;
  });
