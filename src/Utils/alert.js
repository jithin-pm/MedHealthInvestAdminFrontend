import Swal from 'sweetalert2';

export const showAlert = (title, text, icon) => {
    return Swal.fire({
        title,
        text,
        icon,
        confirmButtonColor: '#000000',
        background: '#ffffff',
        customClass: {
            popup: 'premium-swal-popup',
            title: 'premium-swal-title',
            htmlContainer: 'premium-swal-text',
            confirmButton: 'premium-swal-button'
        }
    });
};
