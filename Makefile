COMMIT=$(shell git rev-parse --short=7 HEAD)
ACCT=$(shell aws sts get-caller-identity --query Account --output text)
SERVICE="blackjack-ui"

.PHONY: build
build:
	npm run build && docker build \
		-t $(ACCT).dkr.ecr.us-east-1.amazonaws.com/$(SERVICE):$(COMMIT)-arm64 \
		.

.PHONY: build-x86
build-x86:
	npm run build && docker buildx build --platform linux/amd64 \
		-t $(ACCT).dkr.ecr.us-east-1.amazonaws.com/$(SERVICE):$(COMMIT) \
		.

.PHONY: push-ecr
push-ecr:
	docker push $(ACCT).dkr.ecr.us-east-1.amazonaws.com/$(SERVICE):$(COMMIT) && \
	docker push $(ACCT).dkr.ecr.us-east-1.amazonaws.com/$(SERVICE):latest

.PHONY: push-lightsail
push-lightsail:
	aws lightsail push-container-image \
		--region us-east-1 \
		--service-name $(SERVICE) \
		--label $(COMMIT) \
		--image $(ACCT).dkr.ecr.us-east-1.amazonaws.com/$(SERVICE):$(COMMIT)

.PHONY: deploy-lightsail
deploy-lightsail:
	 ./scripts/deploy-lightsail.sh

.PHONY: test
test:
	npm run test
