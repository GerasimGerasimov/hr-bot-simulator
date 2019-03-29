// подключение express
const express = require("express")
const bodyParser = require('body-parser')
const fs = require("fs").promises
//криптография
const crypto = require('crypto')
const base64url = require('base64url')
// создаем объект приложения
const app = express()
console.log('app start')


function randomStringAsBase64Url(size) {
    return base64url(crypto.randomBytes(size));
  }

//получаю массив объектов key:value
function getConditionsList(o) {
    let arr=[]
    for (key in o) {
        arr.push({key, value:o[key]})
    }   
    return arr
}

//проверка есть ли в объекте item поля со значениями как в conditionsList
//если есть от возвращаю true для фильтрации
//(если нет соответсвия или соответсвие на полное то false)
function getMatched(item, conditionsList) {
    let result = 0;
    conditionsList.forEach(element => {
        if (item[element.key] == element.value) result++
    });
    return (result == conditionsList.length)
}

function getFirstKeyValue (o) {
    for (key in o) {
        return ({key, value:o[key]})
    }
}

let userToken = ''

app.all('*', function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

//app.use(bodyParser.urlencoded({ extended: true }))
// определяем обработчик для маршрута "/"
/*
app.get("/", (request, response) => {
    console.log(request)
    // отправляем ответ
    response.send("<h2>Привет Express!</h2>")
});
*/

function checkBasicAuth(request) {
    console.log(request.headers.authorization)
    let s = request.headers.authorization.split(' ')
    if ((s[0] === 'Basic') && (s.length > 0)) {
        s = s[1]
        console.log(s = base64url.decode(s))
        return true
    } else {
        return false
    }
}
//Аутентификация
app.post('/v1/auth/', (request, response) => {
    console.log('/v1/auth/')
    if (!checkBasicAuth(request)) {
        response.status(404).send('Auth header format error. Basic not found')
        return
    }
    userToken = randomStringAsBase64Url(20)//'$pbkdf2-sha256$29000$f08JgfCek5LyvheCkHKudQ$cwvMrFYk1J/RgRSWyQgLMlv3RAniCy4dy.lT0cTd87s'
    const data = {
        data: {
            token: userToken
        },
        succses: true
    }
    response.json(JSON.parse(JSON.stringify(data)))
})

//Получение данных о группах пользователя
app.get('/v1/data/users/', (request, response) => {
    console.log('/v1/data/users/')
    if (!checkBasicAuth(request)) {
        response.status(404).send('Auth header format error. Basic not found')
        return
    }
    // отправляем ответ
    fs.readFile('data/groups.json', {encoding: 'utf-8'})
    .then (data => JSON.parse(data))//полученные из файла данные превратил в JSON
    .then (data => getFirstKeyValue(data).value)//а их в свою очередь преобразовал в массив
    .then (data => {//получил массив объектов, теперь фильтрануть по заданым свойствам
        //в request.query заданы критерии фильтрации (поле и его значение)
        const cList =  getConditionsList(request.query) 
        const filtred = data.filter(item => getMatched(item,  cList))
        if (filtred.length == 0) 
            throw new Error ('Items Not Found')
        const result = filtred.reduce( (acc, item, index, arr) => 
            acc += (JSON.stringify(item,null,4))+(index != (arr.length-1)?',':''),
            '[')
        + ']'
        //console.log(result)
        //теперь обернуть полученный результат в секцию "data" и "groups"
        const groups = {
            data: {
                groups : JSON.parse(result)
            }
        }
        //console.log(groups)
        response.json(groups)
    })
    .catch (error => {
        console.error(error)
        response.status(404).send(`Get group data error:${error}`)
    })
})

//http://localhost:3000/groups/ возвращает массив всех элементов
//http://localhost:3000/groups/?id=1 - возвращает массив с одним элементом у которого id = 1
//http://localhost:3000/groups/?id=1&name=Tom - возвращает массив с одним элементом у которого id = 1 и name = Tom
/*
app.get("/groups/*", (request, response) => {
        console.log(request)
        // отправляем ответ
        fs.readFile('data/groups.json', {encoding: 'utf-8'})
        .then (data => JSON.parse(data))//полученные из файла данные превратил в JSON
        .then (data => getFirstKeyValue(data).value)//а их в свою очередь преобразовал в массив
        .then (data => {//получил массив объектов, теперь фильтрануть по заданым свойствам
            //в request.query заданы критерии фильтрации (поле и его значение)
            const cList =  getConditionsList(request.query) 
            const filtred = data.filter(item => getMatched(item,  cList))
            if (filtred.length == 0) 
                throw new Error ('Items Not Found')
            const result = filtred.reduce( (acc, item, index, arr) => 
                acc += (JSON.stringify(item,null,4))+(index != (arr.length-1)?',':''),
                '[')
            + ']'
            console.log(result)
            response.json(JSON.parse(result))
        })
        .catch (error => {
            console.error(error)
            response.status(404).send(`Get group data error:${error}`)
        })
});
*/
// начинаем прослушивать подключения на 3000 порту
app.listen(5000)