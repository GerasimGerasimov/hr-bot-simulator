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

let userToken = ''

// parse application/json
//app.use(bodyParser.json())

// create application/json parser
var jsonParser = bodyParser.json()

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


checkBasicAuth = (request) => {
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


app.get('/v1/data/users/', (request, response) => {
    console.log('/v1/data/users/')
    if (!checkBasicAuth(request)) {
        response.status(404).send('Auth header format error. Basic not found')
        return
    }
    // отправляем ответ
    fs.readFile('data/groups.json', {encoding: 'utf-8'})
    .then (data=> JSON.parse(data))//полученные из файла данные превратил в JSON
    .then (data => {
        const groups = {
            data
        }
        response.json(groups)
    })
    .catch (error => {
        console.error(error)
        response.status(404).send(`Get group data error:${error}`)
    })
})

//В request.path получаю строку вида "/v1/data/groups/3/"
//я должен её превратить в "data/groups/3"
//Убрать всё до data и последний слэш
//это будет название объекта
getGroupNameFromPath = (uri) =>{
    let res = uri.substring(0, uri.length - 1);//удаляю последний слэш
    let i = res.match(/data/i)
    res = res.substring(i.index, res.length)
    return res
}

//запись изменения в группу
app.put('/v1/data/groups/:id', jsonParser, (request, response) => {
    console.log('request=>',request)
    if (!checkBasicAuth(request)) {
        response.status(404).send('Auth header format error. Basic not found')
        return
    }
    // готовим ответ
    fs.readFile('data/groups.json', {encoding: 'utf-8'})//прочитал весь файл
    .then (data=> JSON.parse(data))//полученные из файла данные превратил в JSON
    .then (data => {//а из JSON в объект
        const groups = {
            data
        }
        console.log('groups=>',groups)
        //в request.query заданы критерии фильтрации (поле и его значение)
        console.log('request.body=>',request.body)
        let changes = {}
        Object.assign(changes,request.body)
        console.log('changes:',changes)
        //В request.path получаю строку вида "/v1/data/groups/3/"
        //я должен её превратить в "data/groups/3"
        const groupName = getGroupNameFromPath(request.path) //получаю название объекта
        console.log('groupName', groupName)
        let group = groups.data.Groups[groupName]//получаю группу и
        console.log('group before:', group)
        //теперь можно слить группу и её изменения
        Object.assign(group, changes)//изменения внесены
        console.log('group after:', group)
        //теперь надо записать изменения в файл
    fs.writeFile('data/groups.json',
                    JSON.stringify(groups.data, null, 2),
                        'utf8')
    .then   (response.json(group))
    })
    .catch (error => {
        console.error(error)
        response.status(404).send(`Get group data error:${error}`)
    })
})

//удаление группы
app.delete('/v1/data/groups/:id', (request, response) => {
    console.log('request=>',request)
    if (!checkBasicAuth(request)) {
        response.status(404).send('Auth header format error. Basic not found')
        return
    }
    // готовим ответ
    fs.readFile('data/groups.json', {encoding: 'utf-8'})//прочитал весь файл
    .then (data=> JSON.parse(data))//полученные из файла данные превратил в JSON
    .then (data => {//а из JSON в объект
        const groups = {
            data
        }
        //В request.path получаю строку вида "/v1/data/groups/3/"
        //я должен её превратить в "data/groups/3"
        const groupName = getGroupNameFromPath(request.path) //получаю название объекта
        console.log('DELETE group', groupName)
        if (groups.data.Groups[groupName] === undefined)//удаляю
            throw new Error('DELETE_GROUP failed - group not found')//поднимаю исключение выше

        delete groups.data.Groups[groupName]//удаляю
        //теперь надо записать изменения в файл
    fs.writeFile('data/groups.json',
                    JSON.stringify(groups.data, null, 2),
                        'utf8')
    .then   (response.json({
                            "message": "Group was removed",
                            "success": true
            }))
    })
    .catch (error => {
        console.error(error)
        response.status(404).send(`Delete group error:${error}`)
    })
})


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

//Получение данных Группы
app.get('/v1/data/groups/:id', (request, response) => {
    console.log('/v1/data/groups/')
    if (!checkBasicAuth(request)) {
        response.status(404).send('Auth header format error. Basic not found')
        return
    }
    // готовлю
    fs.readFile('data/groups.json', {encoding: 'utf-8'})
    .then (data=> JSON.parse(data))//полученные из файла данные превратил в JSON
    .then (data => {
        const GroupPath = getGroupNameFromPath(request.path) //получаю название объекта
        console.log('GET Group', GroupPath)
        let Group = data.Groups[GroupPath]
        response.json(Group)
    })
    .catch (error => {
        console.error(error)
        response.status(404).send(`Get Group data error:${error}`)
    })
})

//Получение данных Кандидата
app.get('/v1/data/candidates/:id', (request, response) => {
    console.log('/v1/data/candidates/')
    if (!checkBasicAuth(request)) {
        response.status(404).send('Auth header format error. Basic not found')
        return
    }
    // готовлю
    fs.readFile('data/candidates.json', {encoding: 'utf-8'})
    .then (data=> JSON.parse(data))//полученные из файла данные превратил в JSON
    .then (data => {
        const CandidatePath = getGroupNameFromPath(request.path) //получаю название объекта
        console.log('GET Candidate', CandidatePath)
        let Candidate = data.data[CandidatePath]
        response.json(Candidate)
    })
    .catch (error => {
        console.error(error)
        response.status(404).send(`Get Candidate data error:${error}`)
    })
})

function PromiseTimeout(delayms) {
    return new Promise(function (resolve, reject) {
        setTimeout(()=>{console.log('таймер сработал!!!')}, delayms);
    });
}

const delay = t => new Promise(resolve => setTimeout(resolve, t));

//запись изменений данных Кандидата
app.put('/v1/data/candidates/:id', jsonParser, (request, response) => {
    console.log('request=>',request)
    if (!checkBasicAuth(request)) {
        response.status(404).send('Auth header format error. Basic not found')
        return
    }
    // готовим ответ
    delay(1000)//задержка перед ответом
    .then (()=>{  
    fs.readFile('data/candidates.json', {encoding: 'utf-8'})//прочитал весь файл
    .then (data=> JSON.parse(data))//полученные из файла данные превратил в JSON
    .then (data => {//а из JSON в объект
        const Candidates = {
            data
        }
        console.log('Candidates:',Candidates)
        //в request.query заданы критерии фильтрации (поле и его значение)
        console.log('request.body=>',request.body)
        let changes = {}
        Object.assign(changes,request.body)
        //console.log('changes:',changes)
        //В request.path получаю строку вида "/v1/data/candidates/3/"
        //я должен её превратить в "data/candidates/3"
        const candidateName = getGroupNameFromPath(request.path) //получаю название объекта
        console.log('candidateName', candidateName)
        let Candidate = Candidates.data.data[candidateName]//получаю кандидата и
        //теперь можно слить группу и её изменения
        Object.assign(Candidate, changes)//изменения внесены
        console.log('Candidate after:', Candidate)
        //теперь надо записать изменения в файл
        return {Candidates, Candidate}
    })
    .then (({Candidates, Candidate})=>
                {  
                fs.writeFile('data/candidates.json',
                    JSON.stringify(Candidates.data, null, 2),
                        'utf8')              
                .then(response.json(Candidate))
            })
        }) 
    .catch (error => {
        console.error(error)
        response.status(404).send(`Get Candidate data error:${error}`)
    })
})


// начинаем прослушивать подключения на 3000 порту
app.listen(5000)

/*
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
*/

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

/*
function doENTRY(action){
    return `${action}:42`
}

function doDEL(action){
    return `${action}:43`
}

function applyAction(action) {
    console.log('applyAction:Action:', action)
    let doAction = {
        //'ENTRY': function () {return '42'},
        //'DEL'  : function () {return '43'}
        'ENTRY': doENTRY,
        'DEL'  : doDEL
    }
    return doAction[action](action)
}

console.log(applyAction('ENTRY'))
console.log(applyAction('DEL'))
*/