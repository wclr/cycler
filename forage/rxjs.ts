import { TaskSource } from '@cycler/task/rxjs'
import { ForageRequest, ForageResponse } from './interfaces'

export type ForageSource = TaskSource<ForageRequest, ForageResponse>