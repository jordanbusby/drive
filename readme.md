##


##
## REGISTER
##
curl -v -X POST localhost:3005/register -H 'Content-Type: application/json' \
    -d '{"email":"jordan@agristoreast.com","name":"Jordan Busby","password":"secret","passwordConfirmation":"secret", "org":"ASE","root":"/filestore"}'


##
## LOGIN
##
curl -v -X POST localhost:3005/login -H 'Content-Type: application/json' \
    -d '{"email":"jordan@agristoreast.com", "password":"secret12"}'

##
## LOGOUT
##
curl -v -X POST localhost:3005/logout -J 'Content-Type: application/json' \
    --cookie ''


##
## HOME
##
curl -v -X GET localhost:3005/home -H 'Content-Type: application/json' \
    -cookie ''