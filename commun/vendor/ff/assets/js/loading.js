document.addEventListener("DOMContentLoaded", function () {
    const loadingOverlay = document.getElementById('loading-overlay');

    window.addEventListener('load', () => {
        loadingOverlay.classList.add('hidden');
    });

    $(document).ajaxStart(function () {
        loadingOverlay.classList.remove('hidden');
    });

    $(document).ajaxStop(function () {
        loadingOverlay.classList.add('hidden');
    });
});