$(function (){
    $('#div-modal-long').on('shown.bs.modal', function (e) {
        const btnTarget = e.relatedTarget;
        let title = $(btnTarget).data('doc-alias');
        const modalBodyContent = $(this).find("#modal-body-content");
        const docId = $(btnTarget).data('doc-id');
        if (typeof title === 'string')
            $('#exampleModalLongTitle').html(title.toUpperCase());
        else {
            $('#exampleModalLongTitle').html($(btnTarget).closest('.acc-doc-com').find('strong')[0].innerHTML);
        }
           
        $.ajax({
            type:'GET',
            url:$(btnTarget).data('path'),
            data:{
                docId,
                docAlias:$(btnTarget).data('doc-alias')
            },
            success: function (response){
                modalBodyContent.html('<div class="row"><h4>Description:</h4>' +response.description+
                    '</div>' +
                    '<div class= "doc-preview">'+
                    // '<a href="/serve/'+docId+'" data-toggle="lightbox"><img alt="" src="/serve/'+docId+'" /></a>'+
                    '</div >'
                )
            }
        });
    })
});
