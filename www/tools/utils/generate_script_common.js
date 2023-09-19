exports.createContentScriptCommon = () => {
    let outputtedFile = `
        <script type="text/javascript" src="https://cdn.tiny.cloud/1/mnhe8mkhfadk24d7pbtvd880370fc3jyxr34fxx0csiks0gt/tinymce/5/tinymce.min.js" referrerpolicy="origin"></script>
        <script>
    `;

    outputtedFile += `
        let alertTimeout = null;

        const languageDataTable = {
            "language": {
                "lengthMenu": "Hiển thị _MENU_ kết quả",
                "search": "Tìm kiếm",
                "zeroRecords": "Không tìm thấy kết quả trùng khớp",
                "info": "Trang _PAGE_ tổng _PAGES_ kết quả",
                "infoEmpty": "Không tìm thấy kết quả",
                "infoFiltered": "(lọc từ _MAX_ kết quả hiện có)",
                "paginate": {
                    "first":      "Trang đầu tiên",
                    "last":       "Trang cuối cùng",
                    "next":       "Trang tiếp",
                    "previous":   "Trang trước"
                },
            },
            "lengthMenu": [[5, 10, 25, 50, 100], [5, 10, 25, 50, 100]]
        }

		const languageDateRangePicker = {
            showDropdowns: true,
            autoUpdateInput: false,
            locale: {
                cancelLabel: 'Clear',
				"format": "MM/DD/YYYY",
				"separator": " - ",
				"applyLabel": "Áp dụng",
				"cancelLabel": "Huỷ bỏ",
				"fromLabel": "Từ",
				"toLabel": "Đến",
				"customRangeLabel": "Chọn",
				"weekLabel": "W",
				"daysOfWeek": [
					"CN",
					"T2",
					"T3",
					"T4",
					"T5",
					"T6",
					"T7"
				],
				"monthNames": [
					"Tháng 1",
					"Tháng 2",
					"Tháng 3",
					"Tháng 4",
					"Tháng 5",
					"Tháng 6",
					"Tháng 7",
					"Tháng 8",
					"Tháng 9",
					"Tháng 10",
					"Tháng 11",
					"Tháng 12"
				],
				"firstDay": 1
            },
            ranges: {
                "Hôm nay": [moment(), moment()],
                "Hôm qua": [moment().subtract(1, "days"), moment().subtract(1, "days")],
                "7 ngày trước": [moment().subtract(6, "days"), moment()],
                "30 ngày trước": [moment().subtract(29, "days"), moment()],
                "Tháng này": [moment().startOf("month"), moment().endOf("month")],
                "Tháng trước": [moment().subtract(1, "month").startOf("month"), moment().subtract(1, "month").endOf("month")]
            }
        }

        function AlertCustom({ icon = 'info', title = '', message = '', position = 'top-right', delay = 1500 }){
            let alertClass = '';

            switch (icon) {
                case 'success':
                    alertClass = '.custom-alert-success';
                    break;
                case 'error':
                    alertClass = '.custom-alert-danger';
                    break;
                case 'warning':
                    alertClass = '.custom-alert-warning';
                    break;
                default:
                    alertClass = '.custom-alert-primary';
                    break;
            }

            clearTimeout(alertTimeout);

            $(alertClass).addClass(${'`show ${position}`'});
            $(alertClass).find('.alert-title').html(title);
            $(alertClass).find('.alert-message').html(message);

            alertTimeout = setTimeout(() => $(alertClass).removeClass('show'), delay);
        }

        function ToastCustom({ icon = 'info', title, position = 'top', timer = 1500 }){
            return Swal.mixin({
                toast: true,
                position,
                showConfirmButton: false,
                timer,
                didOpen: (toast) => {
                    toast.addEventListener('mouseenter', Swal.stopTimer)
                    toast.addEventListener('mouseleave', Swal.resumeTimer)
                }
            }).fire({
                icon,
                title
            })
        }

        function ConfirmCustom({ 
            title, text = '',
            showCancelButton = true,
            confirmButtonColor = '#3085d6',
            cancelButtonColor = '#d33',
            confirmButtonText = 'Xác nhận',
            cancelButtonText = 'Huỷ'
        }){
            return new Promise(resolve => {
                Swal.fire({
                    title,
                    text,
                    showCancelButton,
                    confirmButtonColor,
                    cancelButtonColor,
                    confirmButtonText,
                    cancelButtonText,
                }).then((result) => {
                    resolve(result);
                })
            })
        }

        function ConfirmCustomAjax({ 
            title, text = '',
            showCancelButton = true,
            confirmButtonColor = '#3085d6',
            cancelButtonColor = '#d33',
            confirmButtonText = 'Xác nhận',
            cancelButtonText = 'Huỷ',
            preConfirm = () => {},
            cb = () => {},
        }){
            return new Promise(resolve => {
                Swal.fire({
                    title,
                    text,
                    showCancelButton,
                    confirmButtonColor,
                    cancelButtonColor,
                    confirmButtonText,
                    cancelButtonText,
                    showLoaderOnConfirm: true,
                    preConfirm: () => preConfirm(),
                    allowOutsideClick: () => !Swal.isLoading()
                }).then(cb)
            })
        }

        function ConfirmCustomWithIcon({ 
            title, text = '', icon = 'info',
            showCancelButton = true,
            confirmButtonColor = '#3085d6',
            cancelButtonColor = '#d33',
            confirmButtonText = 'Xác nhận',
            cancelButtonText = 'Huỷ'
        }){
            return new Promise(resolve => {
                Swal.fire({
                    title,
                    text,
                    icon,
                    showCancelButton,
                    confirmButtonColor,
                    cancelButtonColor,
                    confirmButtonText,
                    cancelButtonText,
                }).then((result) => {
                    resolve(result);
                })
            })
        }
        
        function enableButtonLoading(selector) {
			$(selector)
                .attr("disabled", true)
                .prepend('<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>')
		}

        function disableButtonLoading(selector) {
			$(selector)
                .attr("disabled", false)
                .find('span')
                .remove();
		}

        function enableValidate(input, text = '') {
            $(input)
                .addClass('parsley-error')
                .next()
                .addClass('filled')
                .find('li')
                .text(text);
        }

        function disableValidate(input) {
            $(input)
                .removeClass('parsley-error')
                .next()
                .removeClass('filled')
                .find('li')
                .text('');
        }

        function initMultiCleave(elems) {
			$(elems).toArray().forEach(function(field){
				new Cleave(field, {
					numeral: true,
					numeralThousandsGroupStyle: 'thousand'
				});
			});
		}

        function initOneCleave(selector){
            return new Cleave(selector, {
                numeral: true,
                numeralDecimalMark: ',',
                delimiter: '.'
            });
        }

        function initInputMaxLength(selector){
            $(selector).maxlength({
                alwaysShow: true,
                warningClass: "badge bg-info",
                limitReachedClass: "badge bg-warning"
            });
        }

        function initEditor(selector, options = {}, cb = null, cbUploadImage = null) {
            tinyMCE.init({
                selector,
                plugins: [
                    'advlist autolink lists link image charmap print preview anchor codesample',
                    'searchreplace visualblocks code fullscreen quickbars hr nonbreaking pagebreak',
                    'insertdatetime media table paste imagetools wordcount emoticons' // formatpainter powerpaste
                ],
                toolbar: 'undo redo | styleselect | bold italic | forecolor backcolor |' +
                        'alignleft aligncenter alignright alignjustify |' +
                        'outdent indent | numlist bullist | emoticons nonbreaking | fullscreen',
                menubar: 'file edit insert view format table tools custom',
                advlist_bullet_styles: 'default,square,circle,disc',
                quickbars_selection_toolbar: 'bold italic | forecolor backcolor | formatselect | quicklink blockquote',
                quickbars_insert_toolbar: 'nonbreaking | quicktable | numlist bullist | outdent indent | hr pagebreak | emoticons', // quickimage
                menu: {
                    custom: { title: 'Lists', items: 'customBulletLine customBulletPlus' }
                },
                nonbreaking_force_tab: true,
                lists_indent_on_tab: true,
                statusbar: true,
                draggable_modal: true,
                branding: false,
                fullscreen_native: true,
                height: 250,
                toolbar_mode: 'floating',
                placeholder: 'Type here...',
                default_link_target: '_blank',
                paste_word_valid_elements: "b,strong,i,em,h1,h2",
                paste_enable_default_filters: false,
                mobile: {
                    resize: false
                },
                image: null,
                // paste_preprocess: function(plugin, args) {
                // 	args.content += ' ';
                // },
                // indent_use_margin: true,
                // image_title: true,
                // file_picker_types: 'file image',
                // images_file_types: 'jpeg,jpg,png,bmp,webp',
                // paste_as_text: true,
                paste_data_images: false,
                file_picker_callback: function(cb, value, meta){
                    let input = document.createElement('input');
                    input.setAttribute('type', 'file');
                    input.setAttribute('accept', 'image/*');
                    let that = this;
        
                    input.onchange = function () {
                        let file = this.files[0];
                        that.image = file;
        
                        let reader = new FileReader();
                        reader.onload = function (e) {
                            let id = 'blobid' + (new Date()).getTime();
                            let blobCache =  tinymce.activeEditor.editorUpload.blobCache;
                            let base64 = reader.result.split(',')[1];
                            let blobInfo = blobCache.create(id, file, base64);
                            blobCache.add(blobInfo);
                            // console.log({ file, blobCache, base64, blobInfo, uri: blobInfo.blobUri() });
        
                            /* call the callback and populate the Title field with the file name */
                            cb(blobInfo.blobUri(), { title: file.name, alt: file.name });
                        };
                        reader.readAsDataURL(file);
                    };
        
                    input.click();
                    input.remove();
                },
                setup: function(editor){
                    editor.on('OpenWindow', e => {
                        let that = this;
                        $('.tox-button[title="Save"]').off('click').on('click', function() {
                            if(e.target.image && {}.toString.call(cbUploadImage) === '[object Function]'){
                                $(this).prop('disabled', true);
        
                                // cbUploadImage(e.target.image, (uri, file) => {
                                // 	// console.log({ ___uri: uri, __file: file });
                                // 	$(this).prop('disabled', false);
        
                                // 	e.target.windowManager.close();
                                // 	that.image = null;
                                // 	tinyMCE.activeEditor.execCommand('mceInsertContent', false, '
                                // 		<img src="uri" width="300" height="239" alt="" />
                                // 	');
                                // }, that);
                            }
                        })
                    })

                    editor.on('change', function(e) {
                        $('#btnConfirmUpdate').attr('disabled', true);
                    });

                    editor.on('KeyDown', e => {
                        // console.log({ __code: e.keyCode, char, currentChar, __key: e.key });
        
                        if ((e.keyCode == 8 || e.keyCode == 46) && editor.selection) { // delete & backspace keys
                            const selectedNode = editor.selection.getNode(); // get the selected node (element) in the editor
        
                            if (selectedNode && selectedNode.nodeName == 'IMG') {
                                const { src, title, alt } = selectedNode;
                                console.log({ src, title, alt });
                            }
                        }
        
                        if (e.keyCode === 9) { // tab pressed
                            if (e.shiftKey) {
                                editor.execCommand('Outdent');
                            }else {
                                editor.execCommand('Indent');
                            }
        
                            e.preventDefault();
                            return false;
                        }
                    });

                    if(cb && {}.toString.call(cb) === '[object Function]'){
                        cb(editor);
                    }
                },
                ...options,
            });
        }

        // =================== UPLOAD S3 ======================= 👀
        // ======================= UPLOAD S3 =========================
        let arrLinksUploaded = [];
        let isDoneUpload 	 = true;
        let countDone 		 = 0;

        window.onbeforeunload = function() {
            if(!isDoneUpload){
                return isDoneUpload;
            } else return;
        };

        async function addFileToUpload(multiInput, cbDone = null, cbProgress = null, elementContainer = '') {
            isDoneUpload = false;
            let arrUrlPromise 	= [];
            let totalFile 		= 0;

            // Thêm url vào mảng arrUrlPromise
            if(multiInput.length === 1){
                const url = generateLinkS3({ file: multiInput[0] });

                arrUrlPromise = [url];
                totalFile 	  = 1;
            }else if(multiInput.length == undefined){
                const url = generateLinkS3({ file: multiInput });

                arrUrlPromise = [url];
                totalFile 	  = 1;
            } else {
                for (const input of multiInput) {
                    if(input.files && input.files.length){
                        for (const file of input.files) {
                            const url = generateLinkS3({ file, type: input.type });
                            arrUrlPromise = [...arrUrlPromise, url];
                            totalFile++;
                        }
                    } else{
                        let url = generateLinkS3({ file: input, type: input.type });
                        arrUrlPromise = [...arrUrlPromise, url];
                        totalFile++;
                    }
                }
            }

            // Generate link S3 -> get list link upload -> upload S3 async
            const listUrl = await Promise.all(arrUrlPromise);
            listUrl.length && listUrl.map(link => {
                const { file, uri, signedUrl, type, fileName } = link;
                uploadFileS3({ file, uri, signedUrl, elementContainer, totalFile, type, fileName, cbDone, cbProgress });
            })

            return () => listUrl;
        }

		function generateLinkS3({ file, type = '' }) {
			return new Promise(resolve => {
				const { type: contentType, name: fileName } = file;

				$.get(
					location.origin + "/generate-link-s3?name=" + fileName + "&type=" + contentType,
					signedUrl => resolve({ 
                        signedUrl: signedUrl.linkUpload.data,
						uri: ${'`https://s3-ap-southeast-1.amazonaws.com/ldk-software.ldk/root/${signedUrl.fileName}`'},
                        fileName: signedUrl.fileName,
						type: contentType,
						file,
					})
				);
			})
		}

        function uploadFileS3({ file, uri, signedUrl, elementContainer, totalFile, type, fileName, cbDone, cbProgress }) {
            $.ajax({
                url: signedUrl.url,
                type: 'PUT',
                dataType: 'html',
                processData: false,
                headers: { 'Content-Type': file.type },
                crossDomain: true,
                data: file,
                xhr: function() {
                    let myXhr = $.ajaxSettings.xhr();
        
                    myXhr.upload.onprogress = function(e) {
                        console.log(Math.floor(e.loaded / e.total * 100) + '%');
                    };
        
                    if(myXhr.upload){
                        if({}.toString.call(cbProgress) === '[object Function]'){
                            myXhr.upload.addEventListener('progress', e => {
                                if(e.lengthComputable){
                                    let max = e.total;
                                    let current = e.loaded;
                                    let percentage = (current * 100)/max;
                                    cbProgress(percentage, type);
                                }
                            }, false);
                        } else{
                            myXhr.upload.addEventListener('progress', progress, false);
                        }
                    }
        
                    return myXhr;
                },
            }).done(function(){
                previewUpload({ elementContainer, uri });
                countDone++;
                arrLinksUploaded = [...arrLinksUploaded, {
                    uri,
                    type,
                    fileName
                }]
        
                if(countDone === totalFile){
                    // Check is function
                    ({}.toString.call(cbDone) === '[object Function]') && cbDone(arrLinksUploaded);
        
                    arrLinksUploaded = [];
                    isDoneUpload = true;
                    countDone = 0;
                }
            }).fail(function (error) {
                console.error(error);
            });
        }
        
        function progress(e){
            if(e.lengthComputable){
                let max = e.total;
                let current = e.loaded;
                let percentage = (current * 100)/max;
                $('.progress').css({ width: parseInt(percentage) + '%' });
            }
        }

        function previewUpload({ uri, elementContainer }) {
            const container = $(elementContainer);
            if(container.length){
                const img = '<img src="' + uri + '" alt="Img Preview" />';
                container.append(img);
            }
        }

        function getLinksUpload(inputFiles){
            return new Promise(async resolve => {
                await addFileToUpload(inputFiles, resolve);
            })
        }

        // -------------- END UPLOAD S3

        function changeQuery({ query, value, url, urlParams, wait = false }) {
			if(!value || value === "null"){
				urlParams.delete(query);
			} else{
				urlParams.set(query, value);
			}
			!wait && location.replace(url + "?" + urlParams.toString());
		}

        function readURLPreview() {
            if (this.files && this.files[0]) {
                let reader = new FileReader();
                reader.onload = function(e) {
                    $('#imagePreview').css('background-image', "url('" + e.target.result + "')");
                    $('#imagePreview').hide();
                    $('#imagePreview').fadeIn(650);
                }
                reader.readAsDataURL(this.files[0]);
            }
        }

        function readURLMultiPreview(inputs) {
            if ( inputs.files && inputs.files.length ) {
                for (let  i = 0; i < inputs.files.length; i++){
                    let src = URL.createObjectURL(inputs.files[i]);
                    $("#imagePreview").attr("style", "background-image: url(" + src + ");")
                    $("#imagePreview").attr("data-src", src);
                    $('#imagePreview').fadeIn(650);
                    return src;
                }
            }
        }

        function initDropifyCustom(selector, pathPreview, fileName, size) {
            let dropify = $(selector).dropify({
                messages: {
                    'default': 'Kéo & thả file hoặc click vào đây đế chọn file',
                    'replace': 'Kéo & thả hoặc click để thay thế file',
                    'remove':  'Xoá',
                    'error':   'Có lỗi xảy ra'
                },
                error: {
                    'fileSize': 'Kích thước file phải nhỏ hơn ({{ value }} ).',
                    'imageFormat': 'Định dạng hình ảnh cho phép ({{ value }} ).'
                },
                tpl: {
                    preview: '<div class="dropify-preview"><span class="dropify-render"><img src="' + pathPreview + '" style="max-height: 100px;" /></span><div class="dropify-infos"><div class="dropify-infos-inner"><p class="dropify-infos-message">' + size + '</p></div></div></div>',
                    filename: '<p class="dropify-filename">' + fileName + '</p>',
                }
            })

            dropify.on('dropify.beforeClear', function(event, element){
                $(element.wrapper).parent().remove();
            });
        }

        function initDropify(selector) {
            $(selector).dropify({
                messages: {
                    'default': 'Kéo & thả file hoặc click vào đây đế chọn file',
                    'replace': 'Kéo & thả hoặc click để thay thế file',
                    'remove':  'Xoá',
                    'error':   'Có lỗi xảy ra'
                },
                error: {
                    'fileSize': 'Kích thước file phải nhỏ hơn ({{ value }} ).',
                    'imageFormat': 'Định dạng hình ảnh cho phép ({{ value }} ).'
                },
            })
        }

        function initMultiDropify() {
            let dropify = $(".dropify").dropify({
                messages: {
                    'default': 'Kéo & thả file hoặc click vào đây đế chọn file',
                    'replace': 'Kéo & thả hoặc click để thay thế file',
                    'remove':  'Xoá',
                    'error':   'Có lỗi xảy ra'
                },
                error: {
                    'fileSize': 'Kích thước file phải nhỏ hơn ({{ value }} ).',
                    'imageFormat': 'Định dạng hình ảnh cho phép ({{ value }} ).'
                }
            })

            dropify.on('dropify.beforeClear', function(event, element){
                $(element.wrapper).parent().remove();
            });
        }

        function setBoxDragAndDrag(containerDropzone, infoFile){
			const { name, size, path } = infoFile;

			containerDropzone.find('.box-processing-upload-file').addClass('d-none');
			containerDropzone.find('.box-processing-upload-file .progress-bar').css('width', '0%');
			containerDropzone.find('.box-preview-image').removeClass('d-none').find('img').attr('src', path);
		}

		async function uploadFileDropzone(files, containerDropzone) {
			if(files.length){
				containerDropzone.find('.box-drag-and-drop').addClass('d-none');
				containerDropzone.find('.box-preview-image').addClass('d-none');
				containerDropzone.find('.box-processing-upload-file').removeClass('d-none');

				await addFileToUpload(files, links => {
					let indexImage = containerDropzone.find('.box-drag-and-drop').data('index');

					if(links.length === 1){
						const { size } = files[0];
						const { uri, fileName } = links[0];

						const infoFile = {
							name: fileName,
							path: uri,
							size: size,
						}

						containerDropzone.find('.box-drag-and-drop').attr('name', fileName);
						containerDropzone.find('.box-drag-and-drop').attr('size', size);
						containerDropzone.find('.box-drag-and-drop').attr('path', uri);

						return setBoxDragAndDrag(containerDropzone, infoFile);
					}

					links.map((link, i) => {
						const boxDragAndDrop = $(${'`.box-drag-and-drop[data-index="${indexImage++}"]`'});
						const containerDropzoneByBox = boxDragAndDrop.closest('.box-dropzone-file');
                        const { size } = files[i];
                        const { uri, fileName } = link;

						setBoxDragAndDrag(containerDropzoneByBox, {
							name: fileName,
                            path: uri,
                            size: size,
						})

						containerDropzoneByBox.find('.box-drag-and-drop').attr('name', fileName);
						containerDropzoneByBox.find('.box-drag-and-drop').attr('size', size);
						containerDropzoneByBox.find('.box-drag-and-drop').attr('path', uri);
						containerDropzoneByBox.find('.box-drag-and-drop').addClass('d-none');

						boxDragAndDrop
							.next('.box-preview-image')
							.removeClass('d-none')
							.find('img')
							.attr('src', uri)
					})

				}, percentage => {
					percentage = ${'`${Math.ceil(percentage)}%`'};
					containerDropzone.find('.box-processing-upload-file .progress-bar').css('width', percentage);
				})
			}
		}

        function initUploadCustom(element = '.box-dropzone-file') {
            $.each($(element), (i, elem) => {
                let index = $(elem).find('.box-drag-and-drop').data('index');
                let dropZoneID = ${'`#boxDropzoneFile-${index}`'};

                new FileDropzone({
                    target: dropZoneID,
                    fileHoverClass: 'entered',
                    clickable: true,
                    multiple: true,
                    forceReplace: false,
                    unique: true,
                    noFolder: true,
                    accept: 'image/*',
                    onLeave: function () {
                        $(this.element).css('opacity', '1');
                    },
                    onHover: function () {
                        $(this.element).css('opacity', '.5');
                    },
                    onDrop: function () {
                        $(this.element).css('opacity', '1');
                    },
                    onInvalid: function (files) {
                        console.log(files);
                        AlertCustom({ title: 'Chỉ cho phép upload file hình ảnh', icon: 'warning', delay: 2500 });
                    },
                    beforeAdd: async function (files) {
                        let containerDropzone = $(this.element).closest('.box-dropzone-file');
                        
                        for (const file of files) {
                            const fsize = file.size;
                            const fsizeFormat = Math.round((fsize / 1024));

                            if(fsizeFormat > 10240){
                                return AlertCustom({ title: 'Kích thước file phải nhỏ hơn 10MB', icon: 'warning', delay: 2500 });
                            }
                        }

                        $('#btnConfirmUpdate').attr('disabled', false);
                        await uploadFileDropzone(files, containerDropzone);
                    }
                })
            })
        }

        // GENERATE CHUỖI/SỐ NGẪU NHIÊN
        function randomStringAndNumberFixLengthCode(count){
            let text = "";
            let possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"; // abcdefghijklmnopqrstuvwxyz
            for (let i = 0; i < count; i++)
                text += possible.charAt(Math.floor(Math.random() * possible.length));
            return text;
        }

        // GENERATE CHUỖI NGẪU NHIÊN
        function randomStringFixLengthCode(count){
            let text = "";
            let possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
            for (let i = 0; i < count; i++)
                text += possible.charAt(Math.floor(Math.random() * possible.length));
            return text;
        }

        function formatBytes(bytes, decimals = 2) {
            if (bytes === 0) return '0 Bytes';

            const k = 1024;
            const dm = decimals < 0 ? 0 : decimals;
            const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

            const i = Math.floor(Math.log(bytes) / Math.log(k));

            return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
        }

        function isEmpty(value) {
            return typeof value == 'string'
                && !value.trim()
                || typeof value == 'undefined'
                || value === null
                || value == undefined;
        };

        function isEmptyObj(obj){ return Object.keys(obj).length === 0 && obj.constructor === Object }

        function getRandomInt(min, max) {
            min = Math.ceil(min);
            max = Math.floor(max);
            return Math.floor(Math.random() * (max - min + 1)) + min;
        }

        function randomIntBetween(min, max) {
            return Math.floor(Math.random() * (max - min + 1) + min);
        };
        
        function randomIntFromInterval(min, max) {
            return Math.floor(Math.random() * (max - min + 1) + min);
        };

        function checkNumberValid(val){
            if (!val || Number.isNaN(Number(val))) 
                return false;
            return true;
        }

        function checkNumberIsValidWithRange({ arrValid, val }){
            // arr: Array, val: Number
            if (val == null || val == '' || val == undefined || Number.isNaN(Number(val))) // kiểm tra val có phải number (lọc các trường hợp ko phải number)
                return false;
            if (!Array.isArray(arrValid) || !arrValid.includes(Number(val))) // kiểm tra val có nằm trong arr valid
                return false;
        
            return true;
        }

        // -----------CHECK DATE --------//
        // ex valid:  '2021-07-29','12/25/2021' 
        function checkDateValid(date){
            d = new Date(d);
            if (Object.prototype.toString.call(d) === "[object Date]") {
                // it is a date
                if (isNaN(d.getTime())) {  // d.valueOf() could also work
                // date is not valid
                return false;
                } else {
                // date is valid
                    return true;
                }
            } else {
                return false;
                // not a date
            }
        }

    `;

    outputtedFile += `
        </script>
    `;

    return outputtedFile;
}
