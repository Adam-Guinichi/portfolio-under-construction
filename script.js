document.addEventListener('DOMContentLoaded', () => {
  // Background music — intentionally kept subtle.
  const bgMusic = document.getElementById('bg-music');
  const musicToggle = document.getElementById('music-toggle');
  const volumeControl = document.getElementById('volume-control');

  bgMusic.volume = 0.18;
  volumeControl.value = 0.18;

  musicToggle.addEventListener('click', () => {
    if (bgMusic.paused) {
      bgMusic.play().then(() => {
        musicToggle.innerHTML = '<i class="fas fa-pause"></i>';
        musicToggle.setAttribute('aria-label', 'Pause background music');
      }).catch(() => {});
    } else {
      bgMusic.pause();
      musicToggle.innerHTML = '<i class="fas fa-music"></i>';
      musicToggle.setAttribute('aria-label', 'Play background music');
    }
  });

  volumeControl.addEventListener('input', (event) => {
    bgMusic.volume = Number(event.target.value);
  });

  // Start music after the first user interaction if the browser allows it.
  const unlockAudio = () => {
    bgMusic.play().then(() => {
      musicToggle.innerHTML = '<i class="fas fa-pause"></i>';
      musicToggle.setAttribute('aria-label', 'Pause background music');
    }).catch(() => {});
    window.removeEventListener('click', unlockAudio);
    window.removeEventListener('keydown', unlockAudio);
    window.removeEventListener('scroll', unlockAudio);
  };
  window.addEventListener('click', unlockAudio, { once: true });
  window.addEventListener('keydown', unlockAudio, { once: true });
  window.addEventListener('scroll', unlockAudio, { once: true });

  // Simple tabbed, one-page navigation.
  const buttons = document.querySelectorAll('nav button[data-tab]');
  const sections = document.querySelectorAll('main section');

  function showSection(targetId) {
    const target = document.getElementById(targetId);
    if (!target) return;

    buttons.forEach(button => {
      button.classList.toggle('active-btn', button.dataset.tab === targetId);
    });

    sections.forEach(section => section.classList.remove('active'));
    target.classList.add('active');
    window.scrollTo({ top: document.querySelector('nav').offsetTop - 10, behavior: 'smooth' });
  }

  buttons.forEach(button => {
    button.addEventListener('click', () => showSection(button.dataset.tab));
  });

  document.querySelectorAll('.tab-link').forEach(link => {
    link.addEventListener('click', () => showSection(link.dataset.target));
  });

  // Image lightbox for the design archive.
  const galleryImages = document.querySelectorAll('.gallery-item img');
  if (galleryImages.length) {
    const modal = document.createElement('div');
    modal.className = 'image-modal';
    modal.innerHTML = '<button class="close-modal" aria-label="Close image">&times;</button><div class="image-modal-content"><img src="" alt=""></div>';
    document.body.appendChild(modal);

    const closeModal = () => {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    };

    galleryImages.forEach(image => {
      image.addEventListener('click', () => {
        const modalImage = modal.querySelector('img');
        modalImage.src = image.src;
        modalImage.alt = image.alt;
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
      });
    });

    modal.querySelector('.close-modal').addEventListener('click', closeModal);
    modal.addEventListener('click', event => {
      if (event.target === modal) closeModal();
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') closeModal();
    });
  }
});
