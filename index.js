//Referencia as libs utilizadas.
var fs = require("fs");
var _ = require('lodash');
var validator = require('validator');
const phoneUtil = require('google-libphonenumber').PhoneNumberUtil.getInstance();
const PHONE_NUMBER_FORMAT = require('google-libphonenumber').PhoneNumberFormat;
var parse = require('csv-parse');

//Cabeçalho e saída
var ArrayCabecalho = [];
var ArraySaida = [];



fs.readFile('input.csv', function (err, data) {

    parse(data, function (err, csvLines) {

        // Linha 1 cabeçalho
        var headerElem = _.chunk(_.head(csvLines), 1);
       
        let tags = [];
        let type;
        let arrOfHeaderElem;

        for (i = 0; i < headerElem.length; i++) {
            arrOfHeaderElem = headerElem[i].toString().replace(/,/g, '').split(" ");
            tags = _.drop(arrOfHeaderElem);
            type = _.head(arrOfHeaderElem);

            ArrayCabecalho.push(new HeaderVariables(type, tags.slice()));
        }

        csvUserData = _.drop(csvLines); 


        var addresses = [],
            groups = [],
            groupElem = [],
            parsedEmails = [],
            invisible,
            see_all;
        
        for (i = 0; i < csvUserData.length; i++) {
            groups.splice(0, groups.length);
            addresses.splice(0, addresses.length);
            groupElem.splice(0, groupElem.length);
            parsedEmails.splice(0, parsedEmails.length);

            parsedUserData = _.chunk(csvUserData[i], 1);

            for (j = 0; j < csvUserData[i].length; j++) {

                switch (ArrayCabecalho[j].type) {

                    case 'fullname':
                        name = parsedUserData[j].toString();
                        break;

                    case 'eid':
                        id = parsedUserData[j].toString();
                        break;

                    case 'group':

                        if (csvUserData != "") {
                            groupElem = _.chunk(parsedUserData[j].toString().replace('/', ',').split(","), 1);

                            for (k = 0; k < groupElem.length; k++) {
                                if (groupElem[k].toString() != "") {
                                    groups.push(groupElem[k].toString().trim());
                                }
                            }
                            break;
                        }
                    case 'email':
                        parsedEmails = _.chunk(parsedUserData[j].toString().replace('/', ',').split(","), 1);
                        parsedEmails.map(function (parsed_email) { return parsed_email.toString().trim() });

                        for (k = 0; k < parsedEmails.length; k++) {
                            if (validator.isEmail(parsedEmails[k].toString())) {
                                var index = addresses.findIndex(function (addr) {
                                    return addr.address == parsedEmails[k] && addr.type == 'email'
                                });

                                if (index != -1) {
                                    addresses[index].tags.push.apply(addresses[index].tags, ArrayCabecalho[j].tags.slice());
                                }
                                else {
                                    addresses.push(new Address(ArrayCabecalho[j].type, ArrayCabecalho[j].tags.slice(), parsedEmails[k].toString()));
                                }
                            }
                        }
                        break;                    

                    case 'phone':

                        let parsedNumber;
                        phoneNumber = parsedUserData[j].toString().trim();

                        try {
                            parsedNumber = phoneUtil.parse(phoneNumber, 'BR');
                        }
                        catch (phoneErr) {
                            break;
                        }

                        if (phoneUtil.isValidNumber(parsedNumber)) {

                            var index = addresses.findIndex(function (addr) {
                                return addr.address == phoneNumber && addr.type == 'phone'
                            });
                            if (index != -1) {
                                addresses[index].tags.push.apply(addresses[index].tags, ArrayCabecalho[j].tags.slice());
                            }
                            else {
                                addresses.push(new Address(ArrayCabecalho[j].type, ArrayCabecalho[j].tags.slice(), phoneUtil.format(parsedNumber, PHONE_NUMBER_FORMAT.E164).replace("+", "")));
                            }

                        }
                        break;

                    case 'invisible':

                        invisible_input = parsedUserData[j].toString();

                        if (invisible_input == "" || invisible_input == "0" || invisible_input == "no") {
                            invisible = false;
                        }
                        else {
                            invisible = true;
                        }
                        break;

                    case 'see_all':
                        see_all_input = parsedUserData[j].toString();

                        if (see_all_input == "" || see_all_input == "0" || see_all_input == "no") {
                            see_all = false;
                        }
                        else {
                            see_all = true;
                        }
                        break;
                }
            }

            let userID;
            userID = ArraySaida.findIndex(function (user) {
                return user.eid == id;
            });

            if (userID != -1) {
                ArraySaida[userID].addresses.push.apply(ArraySaida[userID].addresses, addresses.slice());
                ArraySaida[userID].groups.push.apply(ArraySaida[userID].groups, groups.slice());

                ArraySaida[userID].invisible = ArraySaida[userID].invisible || invisible;
                ArraySaida[userID].see_all = ArraySaida[userID].see_all || see_all;
            }
            else {
                ArraySaida.push(new User(name, id, groups.slice(), addresses.slice(), invisible, see_all));
            }
        }

        var JSONFile = JSON.stringify(ArraySaida, null, 2);
        fs.writeFile('output.json', JSONFile, 'utf8', function (err) {
            if (err) {
                console.log("An error occurred during JSON creation!");
            }
        });
    });
})



//Funções para separação e organização dos campos.
function HeaderVariables(type, tags) {
    this.type = type;
    this.tags = tags;

}

function User(fullname, eid, groups, addresses, invisible, see_all) {
    this.fullname = fullname;
    this.eid = eid;
    this.groups = groups;
    this.addresses = addresses;
    this.invisible = invisible;
    this.see_all = see_all;
}

function Address(type, tags, address) {
    this.type = type;
    this.tags = tags;
    this.address = address;
}