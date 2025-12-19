export class jobLifecycleRules {


  static ensureCanCompletePayment(
    paymentStatus: string,
    jobStatus: string
  ): void {
    if (paymentStatus !== "COMPLETED" && jobStatus !== "COMPLETED") {
      throw new Error(
        "Payment cannot be completed unless the status is COMPLETED."
      );
    }
  }
//Todo: review the logic
  static ensureCanCloseJob(
    jobStatus: string,
    paymentStatus: string
  ): void {
    if (jobStatus !== "COMPLETED" || paymentStatus === "Paid") {
      throw new Error(   
        "Job cannot be closed unless both job status and payment status are COMPLETED."
      );
    }
  }

  


}
