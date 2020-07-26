#!/bin/bash

# colors for messaging
RED=$(tput setaf 1 :-"" 2>/dev/null)
GREEN=$(tput setaf 2 :-"" 2>/dev/null)
YELLOW=$(tput setaf 3 :-"" 2>/dev/null)
BLUE=$(tput setaf 4 :-"" 2>/dev/null)
RESET=$(tput sgr0 :-"" 2>/dev/null)

function printMsg {
  [ $2 ] && local color=$2 || local color=$BLUE
  
  printf "\n${color}"
  printf %"$(tput cols)"s | tr " " "-"
  printf " ${1}\n"
  printf %"$(tput cols)"s | tr " " "-"
  printf "${RESET}\n"
}

SCRIPT_NAME=`basename "${0}"`

remainingArgs=()
while [[ $# -gt 0 ]]; do
  arg="$1"

  case $arg in
    -d|--domain)
      ALT_NAME="DNS.1 = ${2}"
      shift
    ;;
    -f|--file-name)
      SUBJECT="${2}"
      shift
    ;;
    -h|--help)
      SHOW_HELP='true'
      shift
    ;;
    -i|--ip)
      ALT_NAME="IP.1 = ${2}"
      shift
    ;;
    *)
    # store remaining args in Array
    remainingArgs+=("$1")
    shift
    ;;
  esac
done
set -- "${remainingArgs[@]}" # set args to numerical vars for later access

# Displaying the `help` info is a one-time operation, so just show and exit the
# script.
if [[ -n "$SHOW_HELP" ]]; then
  echo;
  echo " usage: ${SCRIPT_NAME} [OPTIONS] [ARGS]"
  echo "        ${SCRIPT_NAME} -f \"App Name\""
  echo;
  echo " -d, --domain ..... Use a Domain for the subject alt name"
  echo " -f, --file-name .. Name of the certs"
  echo " -h, --help ....... Displays info on how to run this script."
  echo " -i, --ip ......... Use an IP for the subject alt name"
  exit 0;
fi

if [[ "$SUBJECT" == "" ]]; then
  printMsg "[ERROR] No file name supplied for cert\n   example: ${SCRIPT_NAME} -f \"App Name\"" $RED
  exit 1
fi
if [[ "$ALT_NAME" == "" ]]; then
  printMsg "[ERROR] No Alt Name provided\n   example: ${SCRIPT_NAME} -d \"localhost\"\n   example: ${SCRIPT_NAME} -i \"192.168.1.10\"" $RED
  exit 1
fi

CERT_NAME=$(echo "${SUBJECT// /-}" | tr '[:upper:]' '[:lower:]')
CERT_NAME_CA="${CERT_NAME}-CA"
DIR="$(pwd)/certs.${CERT_NAME}"
DAYS_UNTIL_EXPIRATION=3650

# Ensure the directory exists and is empty.
printMsg "[CREATE] Folder for certs:\n  - \"${DIR}\""
rm -rf "${DIR}" && mkdir -p "${DIR}"

printMsg "[CREATE] The OpenSSL config"
cat > "${DIR}/temp.cnf" << EOF
[req]
default_bits = 2048
encrypt_key  = no # Change to encrypt the private key using des3 or similar
default_md   = sha256
prompt       = no
utf8         = yes

# Specify the DN here so we aren't prompted (along with prompt = no above).
distinguished_name = req_distinguished_name

# Extensions for SAN IP and SAN DNS
req_extensions = v3_req

[req_distinguished_name]
C  = US
ST = Kansas
L  = Oz
O  = Acme
CN = $SUBJECT

# Allow Client and Server auth.
# Link to SAN names.
[v3_req]
basicConstraints     = CA:FALSE
subjectKeyIdentifier = hash
keyUsage             = digitalSignature, keyEncipherment
extendedKeyUsage     = clientAuth, serverAuth
subjectAltName       = @alt_names

# Alternative names are specified as IP.# and DNS.# for IP addresses and
# DNS accordingly. 
[alt_names]
$ALT_NAME
EOF

printMsg "[CREATE] The Certificate Authority"
openssl req -new -newkey rsa:2048 -days ${DAYS_UNTIL_EXPIRATION} -nodes -x509 -subj "/C=US/ST=Kansas/L=Oz/O=${SUBJECT} (CA)" -keyout "${DIR}/${CERT_NAME_CA}.key" -out "${DIR}/${CERT_NAME_CA}.crt"

printMsg "[CREATE] The private key"
openssl genrsa -out "${DIR}/${CERT_NAME}.key" 2048

printMsg "[CREATE] The CSR"
openssl req -new -key "${DIR}/${CERT_NAME}.key" -out "${DIR}/${CERT_NAME}.csr" -config "${DIR}/temp.cnf"
  
# Sign the CSR with our CA. This will generate a new certificate that is signed
# by our CA.
printMsg "[CREATE] The cert"
openssl x509 -req -days ${DAYS_UNTIL_EXPIRATION} -in "${DIR}/${CERT_NAME}.csr" -CA "${DIR}/${CERT_NAME_CA}.crt" -CAkey "${DIR}/${CERT_NAME_CA}.key" -CAcreateserial -extensions v3_req -extfile "${DIR}/temp.cnf" -out "${DIR}/${CERT_NAME}.crt"

printMsg "[VERIFY] The cert"
openssl x509 -in "${DIR}/${CERT_NAME}.crt" -noout -text

printMsg "[REMOVE] Temporary files"
rm -v "${DIR}/${CERT_NAME_CA}.srl" "${DIR}/${CERT_NAME}.csr" "${DIR}/temp.cnf"
