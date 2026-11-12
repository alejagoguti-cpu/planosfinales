const header = document.querySelector('.site-header');
const headerInner = document.querySelector('.header-inner');
const menu = document.querySelector('#site-menu');

let lastCollapsedWidth = 0;

function syncNavigation() {
  const wasOpen = menu.matches(':popover-open');
  const currentlyWide = header.classList.contains('is-wide');
  const width = headerInner.clientWidth;

  if (!currentlyWide && width <= lastCollapsedWidth) return;

  header.classList.add('is-measuring', 'is-wide');
  menu.removeAttribute('popover');
  const fits = headerInner.scrollWidth <= headerInner.clientWidth;
  header.classList.toggle('is-wide', fits);

  if (!fits) {
    lastCollapsedWidth = width;
    menu.setAttribute('popover', 'auto');
    if (wasOpen && typeof menu.showPopover === 'function') menu.showPopover();
  }

  requestAnimationFrame(() => header.classList.remove('is-measuring'));
}

if ('ResizeObserver' in window) {
  const observer = new ResizeObserver(syncNavigation);
  observer.observe(header);
  observer.observe(menu);
} else {
  window.addEventListener('resize', syncNavigation, { passive: true });
}
syncNavigation();

menu.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    if (menu.matches(':popover-open')) menu.hidePopover();
  });
});

const floorData = {
  6: { use: 'Sky lounge' },
  5: { use: 'Habitaciones' },
  4: { use: 'Habitaciones' },
  3: { use: 'Habitaciones' },
  2: { use: 'Podium' }
};

const floorNumber = document.querySelector('[data-floor-number]');
const floorUse = document.querySelector('[data-floor-use]');
const floorImage = document.querySelector('[data-floor-image]');

document.querySelectorAll('.floor-button').forEach((button) => {
  button.addEventListener('click', () => {
    const floor = button.dataset.floor;
    document.querySelectorAll('.floor-button').forEach((item) => {
      const active = item === button;
      item.classList.toggle('is-active', active);
      item.setAttribute('aria-pressed', String(active));
    });
    floorNumber.textContent = floor.padStart(2, '0');
    floorUse.textContent = floorData[floor].use;
    floorImage.alt = `Placeholder del plano del nivel ${floor}`;
  });
});

document.querySelector('[data-scroll-target]').addEventListener('click', (event) => {
  document.querySelector(event.currentTarget.dataset.scrollTarget)?.scrollIntoView({ behavior: 'smooth' });
});

