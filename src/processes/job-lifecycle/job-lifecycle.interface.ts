import { JobCard } from "@/modules/job/domain/job.entity";
import { assignMechanicCommand, createJobCommand, initiatePaymentCommand, jobStatusCommand, updateEstimateCommand } from "./job-lifecycle.types";
import { CreateJobUseCase } from "@/modules/job/application/create-job.use-case";
import { UpdateJobStatusUseCase } from "@/modules/job/application/update-job-status.use-case";
export interface jobLifecycle{
    //creation of job
    createJob(data: createJobCommand):Promise<JobCard>;
    //assignment of mechanic
    assignMechanic(data :assignMechanicCommand  ):void;

    startJob(data : jobStatusCommand):void;
    //estimate generation
    updateEstimate(data : updateEstimateCommand):Promise<JobCard>;  

    updateJobStatus(data : jobStatusCommand):void;
    intiatePayment(data : initiatePaymentCommand):void;
    checkPaymentStatus():void;
    closeJob():void;
}


export class jobLifeCycle implements jobLifecycle {
    createJob(data: createJobCommand): Promise<JobCard> {
        const jobRepository = new JobRepository();
        const createJobUseCase = new CreateJobUseCase(jobRepository);
        return createJobUseCase.execute(data);
        
    }
    assignMechanic(data: assignMechanicCommand): void {
        throw new Error("Method not implemented.");
    }
    startJob(data: jobStatusCommand): void {
        throw new Error("Method not implemented.");
    }

    updateEstimate(data: updateEstimateCommand): Promise<JobCard> {         
        throw new Error("Method not implemented.");
    }
    updateJobStatus(data: jobStatusCommand): Promise<JobCard> {
        const jobRepository = new JobRepository();
        const worker = new UpdateJobStatusUseCase(jobRepository);
        return worker.execute(data);
    }
    intiatePayment(data: initiatePaymentCommand): void {
        throw new Error("Method not implemented.");
    }
    checkPaymentStatus(): void {

        throw new Error("Method not implemented.");
    }
    markAsPaid():void{
        throw new Error("Method not implemented.");
    }
    closeJob(): void {
        throw new Error("Method not implemented.");
    }
}
