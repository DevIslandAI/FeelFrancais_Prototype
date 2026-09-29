$(document).ready(function () {

    const convertDate = (dateString) => {
        const dateParts = dateString.split("/");
        if (dateParts.length === 3) {
            const formattedDate = dateParts[1] + "/" + dateParts[0] + "/" + dateParts[2];
            return new Date(formattedDate);
        }
        return null;
    }

    const displayCursusLength = () => {
        const container = $('.visa-cursus'),
            durations = $('.duration'),
            cursusBeginning = $('input[name="visa_cursus_date[cursusBeginning]"]').eq(0),
            cursusEnding = $('input[name="visa_cursus_date[cursusEnding]"]').eq(0);

        container.hide();
        durations.hide();

        const beginningDate = convertDate(cursusBeginning.val()),
            endingDate = convertDate(cursusEnding.val());

        if (beginningDate instanceof Date && endingDate instanceof Date) {
            let monthsDiff = (endingDate.getFullYear() - beginningDate.getFullYear()) * 12;
            monthsDiff -= beginningDate.getMonth() + 1;
            monthsDiff += endingDate.getMonth();
            container.show();

            if (monthsDiff > 3) {
                $('.long-stay').show();
            } else {
                $('.short-stay').show();
            }

        } 
    }

    $(document).on('change', 'form[name="visa_cursus_date"] input', function(e) {
        e.preventDefault();
        e.stopPropagation();

        displayCursusLength();
    })

    displayCursusLength();
})