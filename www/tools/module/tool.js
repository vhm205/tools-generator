const fs    = require('fs');

module.exports.appendLeftbar = (path, collectionName, collectionDescription, folderName, icon, isSystemConfig) => {
    let lineReader = require('readline').createInterface({
        input: fs.createReadStream(path)
    });
    let line_counter    = ((i = 0) => () => ++i)();
    let ENDPOINT_ADD    = `/${collectionName.toLowerCase()}/add-${collectionName.toLowerCase()}`;
    let ENDPOINT_LIST   = `/${collectionName.toLowerCase()}/list-${collectionName.toLowerCase()}`;
    let hasEndpoint     = false;

    let randomIcons = [
        '<i class="fas fa-database"></i>',
        '<i class="fab fa-docker"></i>',
        '<i class="fas fa-envelope"></i>',
        '<i class="fas fa-exchange-alt"></i>',
        '<i class="fas fa-folder"></i>',
        '<i class="fab fa-github"></i>',
        '<i class="fas fa-home"></i>',
        '<i class="fas fa-history"></i>',
        '<i class="fas fa-key"></i>'
    ]
    let iconLeftbar = randomIcons[Math.floor(Math.random() * randomIcons.length)];

    let childs = [];
    if (isSystemConfig) {
        childs = `
            {
                name: 'Thay đổi ${collectionDescription || collectionName}',
                scope: 'create:${collectionName.toLowerCase()}',
                path: '${ENDPOINT_ADD}'
            },
        `;
    } else {
        childs = `
            {
                name: 'Tạo',
                scope: 'create:${collectionName.toLowerCase()}',
                path: '${ENDPOINT_ADD}'
            },
            {
                name: 'Danh sách',
                scope: 'read:list_${collectionName.toLowerCase()}',
                path: '${ENDPOINT_LIST}'
            }
        `;
    }

    let content = `
        {
            header: 'Quản Lý ${folderName}',
            group: '${folderName}',
            name: 'Quản lý ${collectionDescription || collectionName}',
            scope: 'read:list_${collectionName.toLowerCase()}',
            icon: '${icon ? `<i class="${icon}"></i>` : iconLeftbar}',
            childs: [
                ${childs}
            ]
        },
    `;

    lineReader.on('line', function (line, lineno = line_counter()) {

        if(line.trim().includes(ENDPOINT_LIST)){
            hasEndpoint = true;
        }

        if(line.trim() === '// MARK' && !hasEndpoint){
            console.log('Line from file:', line.trim(), lineno);

            let data = fs.readFileSync(path).toString().split("\n");
            data.splice(lineno - 1, 0, content);
            let text = data.join("\n");

            fs.writeFile(path, text, function (err) {
                if (err) return console.log(err);
            });
        }
    });

}

exports.appendIndex = (path, collectionName) => {
    let lineReaderRequire = require('readline').createInterface({
        input: fs.createReadStream(path)
    });
    let line_counter_require = ((i = 0) => () => ++i)();
    let hasRequire = false;

    const NAME_COLL_UPPERCASE = collectionName.toUpperCase();
    const NAME_COLL_LOWERCASE = collectionName.toLowerCase();

    let contentRequire = `
const ${NAME_COLL_UPPERCASE}_COLL  = require('./databases/${NAME_COLL_LOWERCASE}-coll');
const ${NAME_COLL_UPPERCASE}_MODEL  = require('./models/${NAME_COLL_LOWERCASE}').MODEL;
const ${NAME_COLL_UPPERCASE}_ROUTES  = require('./apis/${NAME_COLL_LOWERCASE}');
    `;

    let contentExport = `
    ${NAME_COLL_UPPERCASE}_COLL,
    ${NAME_COLL_UPPERCASE}_MODEL,
    ${NAME_COLL_UPPERCASE}_ROUTES,
    `;

    lineReaderRequire.on('line', function (line, lineno = line_counter_require()) {

        if(line.trim().includes(`${NAME_COLL_UPPERCASE}_COLL`)){
            hasRequire = true;
        }

        if(line.trim() === '// MARK REQUIRE' && !hasRequire){
            lineReaderRequire.close();
            console.log('Line from file:', line.trim(), lineno);

            let data = fs.readFileSync(path).toString().split("\n");
            data.splice(lineno - 1, 0, contentRequire);
            let text = data.join("\n");

            fs.writeFile(path, text, function (err) {
                if (err) return console.log(err);

                let lineReaderExport = require('readline').createInterface({
                    input: fs.createReadStream(path)
                });
                let line_counter_export = ((i = 0) => () => ++i)();

                lineReaderExport.on('line', function (line, lineno = line_counter_export()) {
                    if(line.trim() === '// MARK EXPORT'){
                        console.log('Line from file:', line.trim(), lineno);

                        let data = fs.readFileSync(path).toString().split("\n");
                        data.splice(lineno - 1, 0, contentExport);
                        let text = data.join("\n");

                        fs.writeFile(path, text, function (err) {
                            if (err) return console.log(err);
                        });
                    }
                })

            });
        }

    });

}
