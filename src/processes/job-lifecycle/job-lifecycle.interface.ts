import { JobCard } from "@/modules/job/domain/job.entity";
import { assignMechanicCommand, createJobCommand, initiatePaymentCommand, jobStatusCommand, updateEstimateCommand } from "./job-lifecycle.types";
import { CreateJobUseCase } from "@/modules/job/application/create-job.use-case";
import { UpdateJobStatusUseCase } from "@/modules/job/application/update-job-status.use-case";
import { SupabaseJobRepository } from "@/modules/job/infrastructure/job.repository.supabase";
import { ensureTenantContext } from "@/lib/supabase/client";
export interface jobLifecycle{
    //creation of job
    createJob(data: createJobCommand):Promise<JobCard>;
    //assignment of mechanic
    assignMechanic(data :assignMechanicCommand  ):void;

    startJob(data : jobStatusCommand):void;
    //estimate generation
    updateEstimate(data : updateEstimateCommand):Promise<JobCard>;  

    updateJobStatus(data : jobStatusCommand):Promise<JobCard>;
    intiatePayment(data : initiatePaymentCommand):void;
    checkPaymentStatus():void;
    closeJob():void;
}


export class jobLifeCycle implements jobLifecycle {
    createJob(data: createJobCommand): Promise<JobCard> {
        const jobRepository = new SupabaseJobRepository();
        const createJobUseCase = new CreateJobUseCase(jobRepository);
        const tenantId = ensureTenantContext();
        
        return createJobUseCase.execute({
            customerId: String(data.customer_id),
            vehicleId: String(data.vehicle_id),
            description: data.description
        }, tenantId);
        
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
        const jobRepository = new SupabaseJobRepository();
        const worker = new UpdateJobStatusUseCase(jobRepository);
        // Note: UpdateJobStatusUseCase.execute returns UpdateJobStatusResult, not just JobCard.
        // We might need to handle the result or change the return type. 
        // For now, let's assume we return the job if successful, or throw.
        
        return worker.execute(data).then(result => {
             if (result.success) {
                 return result.job;
             } else {
                 throw new Error("Job update failed or payment required: " + JSON.stringify(result));
             }
        });
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
