// scripts/faq-toggle.js
document.addEventListener('DOMContentLoaded', () => {
    console.log('FAQ script działa'); // 👈 Dodaj to
  
    const faqItems = document.querySelectorAll('.faq-item');
  
    faqItems.forEach(item => {
      const question = item.querySelector('.faq-question');
  
      question.addEventListener('click', () => {
        item.classList.toggle('open');
      });
    });
  });
  