#!/bin/bash

# get a list of lightsail containers
CONTAINER_ID=$(aws lightsail get-container-images --service-name blackjack-ui | jq '.containerImages[0].image')

CONFIG=$(cat <<EOF
{
    "serviceName": "blackjack-ui",
    "containers": {
        "blackjack-ui": {
            "image": $CONTAINER_ID,
            "command": [],
            "environment": {},
            "ports": {
                "8080": "HTTP"
            }
        }
    },
    "publicEndpoint": {
        "containerName": "blackjack-ui",
        "containerPort": 8080,
        "healthCheck": {
            "healthyThreshold": 2,
            "unhealthyThreshold": 2,
            "timeoutSeconds": 2,
            "intervalSeconds": 5,
            "path": "/",
            "successCodes": "200-499"
        }
    }
}
EOF
)

aws lightsail create-container-service-deployment \
		--service-name blackjack-ui \
		--cli-input-json "$CONFIG"
