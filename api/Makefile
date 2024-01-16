#!make
.DEFAULT_GOAL 								:= deploy

INFRA_DIRECTORY 							:= infra
ENVIRONMENT_FILE 							:= $(INFRA_DIRECTORY)/.env

ifneq (,$(wildcard $(ENVIRONMENT_FILE)))
include $(ENVIRONMENT_FILE)
endif

YARN 													:= yarn
RM 														:= rm
MKDIR 												:= mkdir
CD 														:= cd
CDK 													:= cdk
FIND 													:= find
FIND_DIRECTORY_TYPE_FLAGS			:= -type d
FIND_FILE_TYPE_FLAGS 					:= -type f
FIND_SYMBOLIC_TYPE_FLAGS 			:= -type l
FIND_DELETE_FLAGS 						:= -exec rm -rf {} +

ifdef PROFILE
	PROFILE_OPTION 							:= --profile $(PROFILE)
else
	PROFILE_OPTION 							:=
endif

SOURCE_DIRECTORY 							:= src
BUILD_DIRECTORY 							:= .build
PACKAGE_DIRECTORY 						:= node_modules
BUILD_PACKAGE_DIRECTORY 			:= $(BUILD_DIRECTORY)/layer/nodejs/$(PACKAGE_DIRECTORY)
LAYER_DIRECTORY 							:= $(SOURCE_DIRECTORY)/$(BUILD_DIRECTORY)

USE_CASES_DIRECTORIES 				:= $(filter-out ./ ./infra/, $(sort $(dir $(wildcard ./*/))))
UNIT_TEST_DIRECTORIES 				:= $(USE_CASES_DIRECTORIES)
INT_TEST_DIRECTORIES 					:= $(USE_CASES_DIRECTORIES)

define DOTENV
PROJECT_NAME=$(PROJECT_NAME)
REGION=$(REGION)
ENVIRONMENT=$(ENVIRONMENT)
endef
export DOTENV

env:
	[ -f $(ENVIRONMENT_FILE) ] || $(ECHO) "$$DOTENV" > $(ENVIRONMENT_FILE);

clean:
	$(FIND) . $(FIND_DIRECTORY_TYPE_FLAGS) -name "$(BUILD_DIRECTORY)" $(FIND_DELETE_FLAGS);
	$(FIND) . $(FIND_FILE_TYPE_FLAGS) -name "*.log" $(FIND_DELETE_FLAGS);
	$(FIND) . $(FIND_FILE_TYPE_FLAGS) -name "tsconfig.tsbuildinfo" $(FIND_DELETE_FLAGS);

build:
	cd $(INFRA_DIRECTORY) && $(YARN)
	$(foreach path, $(USE_CASES_DIRECTORIES), cd $(path); pwd; $(YARN) && $(YARN) build; cd -;)

build-layer:
	$(foreach path, $(USE_CASES_DIRECTORIES), cd $(path); $(YARN) install --production --modules-folder $(BUILD_PACKAGE_DIRECTORY); cd -;)

layer: build-layer
	$(FIND) . -maxdepth 9 $(FIND_SYMBOLIC_TYPE_FLAGS) -path "*/$(BUILD_PACKAGE_DIRECTORY)/@nshift/*" -exec sh -c 'cp -r "$$(readlink -f "$$1")" "$$1.test" && rm "$$1" && mv "$$1.test" "$$1"' sh {} \;
	$(FIND) . -maxdepth 11 $(FIND_DIRECTORY_TYPE_FLAGS) -path "*/$(BUILD_PACKAGE_DIRECTORY)/@nshift/*/$(PACKAGE_DIRECTORY)" $(FIND_DELETE_FLAGS);
	$(FIND) . $(FIND_DIRECTORY_TYPE_FLAGS) -path "*/$(BUILD_PACKAGE_DIRECTORY)/.bin" $(FIND_DELETE_FLAGS);

test:
	$(foreach path, $(UNIT_TEST_DIRECTORIES), cd $(path); pwd; $(YARN) && $(YARN) test || exit; cd -;)

int_test:
	$(foreach path, $(INT_TEST_DIRECTORIES), cd $(path); $(YARN) && $(YARN) test:int || exit; cd -;)

deploy: build test layer
	cd $(INFRA_DIRECTORY) && $(YARN)
	cd $(INFRA_DIRECTORY) && $(CDK) bootstrap $(PROFILE_OPTION) --require-approval never
	cd $(INFRA_DIRECTORY) && $(CDK) deploy $(PROFILE_OPTION) --require-approval never

.PHONY: clean build build-layer layer test int_test