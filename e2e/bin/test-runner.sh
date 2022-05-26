#!/bin/bash

# export to ensure docker-compose can use'm
export CURR_UID=$(id -u)
export CURR_GID=$(id -g)

APP__PORT=3000
APP_SERVICE="password-manager"
BUILD=true
# CMD__COMPILE_ASSETS=$(node -e "console.log(require('./bin/release-config').CMD__COMPILE_ASSETS)")
DOCKER_HOST="host.docker.internal"
E2E_SERVICE="e2e-cypress"
SCRIPT_DIR="$(cd "$(dirname "$0")" > /dev/null 2>&1; pwd -P)"
WATCH_MODE=false
isLinux=false
isOSX=false
isWSL=false

# Parse arguments
remainingArgs=()
while [ $# -gt 0 ]; do
  case $1 in
    -s|--skip-build)
      BUILD=false
      shift
      ;;
    -w|--watch)
      WATCH_MODE=true
      shift
      ;;
    -*|--*)
      echo "Unknown option $1"
      exit 1
      ;;
    *)
      remainingArgs+=("$1")
      shift
      ;;
  esac
done
set -- "${remainingArgs[@]}" 

# Linux env
if [ -f "/proc/version" ]; then
  if grep -qE "(Microsoft|WSL)" /proc/version; then
    isWSL=true
  else
    isLinux=true
    DOCKER_HOST="172.17.0.1"
  fi
else
  isOSX=$(uname | grep -qi "darwin" &> /dev/null)
fi

TEST_FOLDER="./e2e"
PATH_01=("${TEST_FOLDER}/cypress.json" "{ \"video\": false }\n")
PATH_02=("${TEST_FOLDER}/cypress/integration")
PATH_03=("${TEST_FOLDER}/cypress/integration/example.test.js" "context('Example', () => {\n  beforeEach(() => { cy.visit('/'); });\n\n  it('should have loaded', () => {\n    cy.get('title').contains(/.*/);\n  });\n});\n")
scaffold=(PATH_01[@] PATH_02[@] PATH_03[@])
if [ ! -f "${!scaffold[0]:0:1}" ]; then
  echo "[SCAFFOLD] Cypress test directory"
  
  length=${#scaffold[@]}
  for ((i=0; i<$length; i++)); do
    path="${!scaffold[i]:0:1}"
    contents="${!scaffold[i]:1:1}"
    
    if [[ "${contents}" != "" ]]; then printf "${contents}" > "${path}"; else mkdir -p "${path}"; fi
  done
fi

cypressCmd=""
xlaunchPath="${SCRIPT_DIR}/XServer.xlaunch"
export CYPRESS_BASE_URL="https://${DOCKER_HOST}:${APP__PORT}"
baseEnvVars=("CYPRESS_BASE_URL=${CYPRESS_BASE_URL}")

# When watching for test changes, `open` (instead of `run`) Cypress so that the
# Dev can use the GUI for an easy test writing experience.
if $WATCH_MODE; then
  extraArgs=$(printf -- "-e %s " "${baseEnvVars[@]}")
  
  if $isWSL; then
    display="${DOCKER_HOST}:0"
    xlaunchBinary="/c/Program Files/VcXsrv/xlaunch.exe"
    xlaunchPath=$(wslpath -w "${SCRIPT_DIR}/XServer.xlaunch")
    xlaunchKillCmd="/c/Windows/System32/taskkill.exe /IM \"vcxsrv.exe\" /F"
    /c/Windows/System32/tasklist.exe | grep -q vcxsrv && SERVER_IS_RUNNING=true || SERVER_IS_RUNNING=false
    
    # If previous Server session wasn't terminated, kill it
    if $SERVER_IS_RUNNING; then
      echo;
      echo "[KILL] Previously running XServer session"
      eval "$xlaunchKillCmd"
    fi
  elif $isOSX; then
    xquartzBinary=$(which xquartz)
    xquartzKillCmd="osascript -e 'quit app \"xquartz\"'"
    IP=$(ifconfig en0 | grep inet | awk '$1=="inet" {print $2}')
    display="$IP:0"
  elif $isLinux; then
    IP=$(ip addr show | grep docker | grep -Eo 'inet ([^/]+)' | sed 's|inet ||')
    DBUS_PATH=$(echo "${DBUS_SESSION_BUS_ADDRESS}" | sed 's|unix:path=||')
    display="${DISPLAY}"
    extraArgs="${extraArgs} -e DBUS_SESSION_BUS_ADDRESS="${DBUS_SESSION_BUS_ADDRESS}" -v /tmp/.X11-unix:/tmp/.X11-unix:rw -v /run/dbus/system_bus_socket:/run/dbus/system_bus_socket -v ${DBUS_PATH}:${DBUS_PATH}"
  fi

  if [[ "$display" != "" ]]; then
    cypressCmd="docker-compose run --user ${CURR_UID}:${CURR_GID} -e DISPLAY=${display} ${extraArgs} --rm --entrypoint cypress ${E2E_SERVICE} open --project ."
    
    if [[ "$xlaunchBinary" != "" ]] && [ -f "$xlaunchBinary" ]; then
      echo;
      echo "[START] XServer"
      "$xlaunchBinary" -run "$xlaunchPath"
    elif [[ "$xquartzBinary" != "" ]] && [ -f "$xquartzBinary" ]; then
      echo;
      echo "[START] XServer"
      xhost + $IP
    elif $isLinux; then
      echo;
      echo "[SET] xhost"
      # 'cypresstests' is the 'hostname' defined in docker-compose.yml
      xhost + local:cypresstests
    else
      echo "[ERROR] The XServer binary could not be located. Follow the instructions in the README to get it installed."
      echo;
      exit 1
    fi
  else
    echo;
    echo "[ERROR] You're trying to run watch mode but no \`DISPLAY\` was set for your OS, and one could not be determined."
    echo;
    exit 1
  fi
fi 

if $BUILD; then
  # echo;
  # echo "[COMPILE] App"
  # eval $CMD__COMPILE_ASSETS
  # if [ $? -ne 0 ]; then
  #   echo "[ERROR] Compiling App for Docker failed."
  #   exit 1
  # fi
  
  echo;
  echo "[BUILD] Containers"
  docker-compose build $APP_SERVICE $E2E_SERVICE
  if [ $? -ne 0 ]; then
    echo "[ERROR] Building Docker image failed."
    exit 1
  fi
fi

echo;
echo "[START] Tests"
echo;
if [[ "$cypressCmd" != "" ]]; then
  echo "[RUN] ${cypressCmd}"
  ${cypressCmd}
else
  envVars=$(printf "export %s; " "${baseEnvVars[@]}")
  # NOTE - `depends_on` in docker-compose will start the App
  eval "${envVars} docker-compose up --abort-on-container-exit ${E2E_SERVICE}" 
fi
exitCode=$(echo $?)

docker-compose down

if [[ "$xlaunchKillCmd" != "" ]]; then
  echo;
  echo "[KILL] XServer"
  eval "$xlaunchKillCmd"
elif [[ "$xquartzKillCmd" != "" ]]; then
  echo;
  echo "[KILL] XServer"
  eval "$xquartzKillCmd"
fi

exit $exitCode
