import { createBucket } from '@nshift/cdk'
import * as cdk from 'aws-cdk-lib'

export const createDocumentBucket = (stack: cdk.Stack) => createBucket('DocumentBucket', stack)
