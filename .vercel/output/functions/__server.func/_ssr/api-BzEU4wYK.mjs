import { i as TSS_SERVER_FUNCTION, r as createServerFn } from "./ssr.mjs";
import { C as truckWrite, S as tripWrite, _ as recoveryRotate, a as customerWrite, b as staffWrite, c as expenseWrite, d as invoiceWrite, f as maintenanceWrite, g as recoverWrite, h as paymentWrite, i as companyWrite, l as fuelWrite, m as passwordResetWrite, n as archiveWrite, o as documentWrite, p as parseInput, r as authMiddleware, s as driverWrite, t as adjustmentWrite, u as idWrite, v as restoreWrite, w as tyreWrite, x as statusWrite, y as staffActiveWrite } from "./schemas-DHrFRtJ9.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/api-BzEU4wYK.js
var createServerRpc = (serverFnMeta, splitImportFn) => {
	const url = "/_serverFn/" + serverFnMeta.id;
	return Object.assign(splitImportFn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
async function domain() {
	return import("./domain.server-7ia4icS5.mjs");
}
var ensureOffice_createServerFn_handler = createServerRpc({
	id: "f1574dbb693028518412eadc7b3bed42e2166c73744cb70f4f7c68c257500321",
	name: "ensureOffice",
	filename: "src/lib/sonu/api.ts"
}, (opts) => ensureOffice.__executeServer(opts));
var ensureOffice = createServerFn({ method: "POST" }).handler(ensureOffice_createServerFn_handler, async () => {
	await (await domain()).ensureSeed();
	return { ready: true };
});
var recoverPassword_createServerFn_handler = createServerRpc({
	id: "94b9a476e2ed1baf3dab5e4a5eea9d3c9f4c06d7a4dc8cc5bf8bc1d86c1451a0",
	name: "recoverPassword",
	filename: "src/lib/sonu/api.ts"
}, (opts) => recoverPassword.__executeServer(opts));
var recoverPassword = createServerFn({ method: "POST" }).validator((input) => parseInput(recoverWrite, input)).handler(recoverPassword_createServerFn_handler, async ({ data }) => {
	return (await domain()).recoverPassword(data.email, data.recoveryCode, data.password);
});
var fetchProfile_createServerFn_handler = createServerRpc({
	id: "f0d31052003c27a1f76c29c3903edaee9ef6a89e0ea9d3d4083231c5b3802e70",
	name: "fetchProfile",
	filename: "src/lib/sonu/api.ts"
}, (opts) => fetchProfile.__executeServer(opts));
var fetchProfile = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(fetchProfile_createServerFn_handler, async ({ context }) => {
	return (await domain()).getProfile(context.userId);
});
var fetchWorkspace_createServerFn_handler = createServerRpc({
	id: "6784131d261e1d9d8af659335cedc0e97b7cbd04b7281f58106c371b94439a58",
	name: "fetchWorkspace",
	filename: "src/lib/sonu/api.ts"
}, (opts) => fetchWorkspace.__executeServer(opts));
var fetchWorkspace = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(fetchWorkspace_createServerFn_handler, async ({ context }) => {
	return (await domain()).getWorkspace(context.userId);
});
var fetchDatabase_createServerFn_handler = createServerRpc({
	id: "2fe1f3d43395f42865e9673914dc6cb467d8c6414972c2d0982c331f520581fc",
	name: "fetchDatabase",
	filename: "src/lib/sonu/api.ts"
}, (opts) => fetchDatabase.__executeServer(opts));
var fetchDatabase = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(fetchDatabase_createServerFn_handler, async ({ context }) => {
	return (await domain()).describeDatabase(context.userId);
});
var saveTruck_createServerFn_handler = createServerRpc({
	id: "93bfa681222325be5e80f2085b40caa14db4dd9164de65a166e07df39f52a091",
	name: "saveTruck",
	filename: "src/lib/sonu/api.ts"
}, (opts) => saveTruck.__executeServer(opts));
var saveTruck = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => parseInput(truckWrite, input)).handler(saveTruck_createServerFn_handler, async ({ context, data }) => (await domain()).saveTruck(context.userId, data));
var archiveTruck_createServerFn_handler = createServerRpc({
	id: "d8eeca43d45db5215df147a3ec2dc9f0216e740cf72162ae7b3c3c0a85c4e1b3",
	name: "archiveTruck",
	filename: "src/lib/sonu/api.ts"
}, (opts) => archiveTruck.__executeServer(opts));
var archiveTruck = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => parseInput(archiveWrite, input)).handler(archiveTruck_createServerFn_handler, async ({ context, data }) => (await domain()).archiveTruck(context.userId, data.id, data.archived, data.acknowledge));
var saveCustomer_createServerFn_handler = createServerRpc({
	id: "5a573bb15081b74d18697e82c776de93408723e6dc8a686f47d6d70e4fa3a76f",
	name: "saveCustomer",
	filename: "src/lib/sonu/api.ts"
}, (opts) => saveCustomer.__executeServer(opts));
var saveCustomer = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => parseInput(customerWrite, input)).handler(saveCustomer_createServerFn_handler, async ({ context, data }) => (await domain()).saveCustomer(context.userId, data));
var saveDriver_createServerFn_handler = createServerRpc({
	id: "1f9768d7b639d770fc6727592259ebb21450178ebcc8c0affd37f0ed65b0369a",
	name: "saveDriver",
	filename: "src/lib/sonu/api.ts"
}, (opts) => saveDriver.__executeServer(opts));
var saveDriver = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => parseInput(driverWrite, input)).handler(saveDriver_createServerFn_handler, async ({ context, data }) => (await domain()).saveDriver(context.userId, data));
var saveTrip_createServerFn_handler = createServerRpc({
	id: "b1323cd8e0c3c608234d48a02dc97ae68258c3adc417565f79d920f96152e92c",
	name: "saveTrip",
	filename: "src/lib/sonu/api.ts"
}, (opts) => saveTrip.__executeServer(opts));
var saveTrip = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => parseInput(tripWrite, input)).handler(saveTrip_createServerFn_handler, async ({ context, data }) => (await domain()).saveTrip(context.userId, data));
var setTripStatus_createServerFn_handler = createServerRpc({
	id: "322fa3ef5b13758f4584e9a78a2a38d8f12aac3a08271eb1207fab852092e990",
	name: "setTripStatus",
	filename: "src/lib/sonu/api.ts"
}, (opts) => setTripStatus.__executeServer(opts));
var setTripStatus = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => parseInput(statusWrite, input)).handler(setTripStatus_createServerFn_handler, async ({ context, data }) => (await domain()).setTripStatus(context.userId, data.id, data.status, data.overrideReason));
var saveFuel_createServerFn_handler = createServerRpc({
	id: "77b7b2c929797170b58e1cda1af686dfcdb50d7d2488caf5b1b07b4bbc5d4dd4",
	name: "saveFuel",
	filename: "src/lib/sonu/api.ts"
}, (opts) => saveFuel.__executeServer(opts));
var saveFuel = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => parseInput(fuelWrite, input)).handler(saveFuel_createServerFn_handler, async ({ context, data }) => (await domain()).saveFuel(context.userId, data));
var saveExpense_createServerFn_handler = createServerRpc({
	id: "c7d8300f9a1bdd3fbf1bfa9ffa013f21e1b833d90097424a3f4e0c2133d40572",
	name: "saveExpense",
	filename: "src/lib/sonu/api.ts"
}, (opts) => saveExpense.__executeServer(opts));
var saveExpense = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => parseInput(expenseWrite, input)).handler(saveExpense_createServerFn_handler, async ({ context, data }) => (await domain()).saveExpense(context.userId, data));
var createInvoice_createServerFn_handler = createServerRpc({
	id: "62bafc5280ae3279f1c62b4c61611474f7ab0325f018e3736bc9aac764febb13",
	name: "createInvoice",
	filename: "src/lib/sonu/api.ts"
}, (opts) => createInvoice.__executeServer(opts));
var createInvoice = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => parseInput(invoiceWrite, input)).handler(createInvoice_createServerFn_handler, async ({ context, data }) => (await domain()).createInvoice(context.userId, data));
var voidInvoice_createServerFn_handler = createServerRpc({
	id: "d3212b63f5294ea7fece7072b692185a87ad7026241e2cb8a9a20c73e0d96104",
	name: "voidInvoice",
	filename: "src/lib/sonu/api.ts"
}, (opts) => voidInvoice.__executeServer(opts));
var voidInvoice = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => parseInput(idWrite, input)).handler(voidInvoice_createServerFn_handler, async ({ context, data }) => (await domain()).voidInvoice(context.userId, data.id));
var recordPayment_createServerFn_handler = createServerRpc({
	id: "0d99d981a54ec71b169b6df5e1080e4df33b69b9cb8df234b4126ed5701484f4",
	name: "recordPayment",
	filename: "src/lib/sonu/api.ts"
}, (opts) => recordPayment.__executeServer(opts));
var recordPayment = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => parseInput(paymentWrite, input)).handler(recordPayment_createServerFn_handler, async ({ context, data }) => (await domain()).recordPayment(context.userId, data));
var saveAdjustment_createServerFn_handler = createServerRpc({
	id: "f893c794638538b54c76954a98d1cef13f9a5d682e0035d6774807e71f89df9f",
	name: "saveAdjustment",
	filename: "src/lib/sonu/api.ts"
}, (opts) => saveAdjustment.__executeServer(opts));
var saveAdjustment = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => parseInput(adjustmentWrite, input)).handler(saveAdjustment_createServerFn_handler, async ({ context, data }) => (await domain()).saveAdjustment(context.userId, data));
var saveMaintenance_createServerFn_handler = createServerRpc({
	id: "ea9ccde79f208db7cde051664f6a1ddfb850f7a88d343ce656b35fc2b707d243",
	name: "saveMaintenance",
	filename: "src/lib/sonu/api.ts"
}, (opts) => saveMaintenance.__executeServer(opts));
var saveMaintenance = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => parseInput(maintenanceWrite, input)).handler(saveMaintenance_createServerFn_handler, async ({ context, data }) => (await domain()).saveMaintenance(context.userId, data));
var completeMaintenance_createServerFn_handler = createServerRpc({
	id: "bcd89c8a9644cd71d566cd02ac9ff4377d46539eb7454ca68bbe438eef69cbfd",
	name: "completeMaintenance",
	filename: "src/lib/sonu/api.ts"
}, (opts) => completeMaintenance.__executeServer(opts));
var completeMaintenance = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => parseInput(idWrite, input)).handler(completeMaintenance_createServerFn_handler, async ({ context, data }) => (await domain()).completeMaintenance(context.userId, data.id));
var saveTyre_createServerFn_handler = createServerRpc({
	id: "6babe3cadc6160add2a75ea6074ff4392a4e9d4a343272396ae41d55b55d4487",
	name: "saveTyre",
	filename: "src/lib/sonu/api.ts"
}, (opts) => saveTyre.__executeServer(opts));
var saveTyre = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => parseInput(tyreWrite, input)).handler(saveTyre_createServerFn_handler, async ({ context, data }) => (await domain()).saveTyre(context.userId, data));
var removeTyre_createServerFn_handler = createServerRpc({
	id: "ae26ee0eb93c9f588f86b248543e02d4e9c5860344df7bf78d3b81af73bfb341",
	name: "removeTyre",
	filename: "src/lib/sonu/api.ts"
}, (opts) => removeTyre.__executeServer(opts));
var removeTyre = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => parseInput(idWrite, input)).handler(removeTyre_createServerFn_handler, async ({ context, data }) => (await domain()).removeTyre(context.userId, data.id));
var saveDocument_createServerFn_handler = createServerRpc({
	id: "aac6d9890f650fc63eb3680797cb68aeea4aa3f6cb6f65cc56c0c20e4e63f582",
	name: "saveDocument",
	filename: "src/lib/sonu/api.ts"
}, (opts) => saveDocument.__executeServer(opts));
var saveDocument = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => parseInput(documentWrite, input)).handler(saveDocument_createServerFn_handler, async ({ context, data }) => (await domain()).saveDocument(context.userId, data));
var fetchDocumentFile_createServerFn_handler = createServerRpc({
	id: "a71e6693af847c75c9d9f70aff969817d0f9dc3cce328e021468cd47889c0b04",
	name: "fetchDocumentFile",
	filename: "src/lib/sonu/api.ts"
}, (opts) => fetchDocumentFile.__executeServer(opts));
var fetchDocumentFile = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => parseInput(idWrite, input)).handler(fetchDocumentFile_createServerFn_handler, async ({ context, data }) => (await domain()).getDocumentFile(context.userId, data.id));
var saveCompany_createServerFn_handler = createServerRpc({
	id: "20f2081ce020d5433d4bc3ed2f6999f14aceb34181c808aaf536b3c05cf9deba",
	name: "saveCompany",
	filename: "src/lib/sonu/api.ts"
}, (opts) => saveCompany.__executeServer(opts));
var saveCompany = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => parseInput(companyWrite, input)).handler(saveCompany_createServerFn_handler, async ({ context, data }) => (await domain()).saveCompany(context.userId, data));
var rotateRecovery_createServerFn_handler = createServerRpc({
	id: "fa2ab9520bc3349259368d78c74b631d570e6fbf1bd9f9517a16b2fbf589714b",
	name: "rotateRecovery",
	filename: "src/lib/sonu/api.ts"
}, (opts) => rotateRecovery.__executeServer(opts));
var rotateRecovery = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => parseInput(recoveryRotate, input)).handler(rotateRecovery_createServerFn_handler, async ({ context, data }) => (await domain()).rotateRecovery(context.userId, data.code));
var createStaff_createServerFn_handler = createServerRpc({
	id: "ea446675849d19fd2fa1ce9077b7fd4af9b86650c656c47f90fe0cdb57241e24",
	name: "createStaff",
	filename: "src/lib/sonu/api.ts"
}, (opts) => createStaff.__executeServer(opts));
var createStaff = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => parseInput(staffWrite, input)).handler(createStaff_createServerFn_handler, async ({ context, data }) => (await domain()).createStaff(context.userId, data));
var setStaffActive_createServerFn_handler = createServerRpc({
	id: "1e2fe7fa3229fd8ad535d9480cc28a5a47efb537b2721be8b095f4cafe808e44",
	name: "setStaffActive",
	filename: "src/lib/sonu/api.ts"
}, (opts) => setStaffActive.__executeServer(opts));
var setStaffActive = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => parseInput(staffActiveWrite, input)).handler(setStaffActive_createServerFn_handler, async ({ context, data }) => (await domain()).setStaffActive(context.userId, data.userId, data.active));
var resetStaffPassword_createServerFn_handler = createServerRpc({
	id: "c97a4c5c001deaaa6fe818a5774d181f6d91dccd2ddb179da46455537f5623cd",
	name: "resetStaffPassword",
	filename: "src/lib/sonu/api.ts"
}, (opts) => resetStaffPassword.__executeServer(opts));
var resetStaffPassword = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => parseInput(passwordResetWrite, input)).handler(resetStaffPassword_createServerFn_handler, async ({ context, data }) => (await domain()).resetStaffPassword(context.userId, data.userId, data.password));
var exportBackup_createServerFn_handler = createServerRpc({
	id: "8c4175af7d8977f1886cb676a147bba3231f00115d6b6c6cda687ba5c7ab3877",
	name: "exportBackup",
	filename: "src/lib/sonu/api.ts"
}, (opts) => exportBackup.__executeServer(opts));
var exportBackup = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(exportBackup_createServerFn_handler, async ({ context }) => (await domain()).exportBackup(context.userId));
var restoreBackup_createServerFn_handler = createServerRpc({
	id: "ac04939487a95ba36d0446a48e6937ed0ad2cf28cafd1301088bfc026df9959f",
	name: "restoreBackup",
	filename: "src/lib/sonu/api.ts"
}, (opts) => restoreBackup.__executeServer(opts));
var restoreBackup = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => parseInput(restoreWrite, input)).handler(restoreBackup_createServerFn_handler, async ({ context, data }) => (await domain()).restoreBackup(context.userId, data.backup));
//#endregion
export { archiveTruck_createServerFn_handler, completeMaintenance_createServerFn_handler, createInvoice_createServerFn_handler, createStaff_createServerFn_handler, ensureOffice_createServerFn_handler, exportBackup_createServerFn_handler, fetchDatabase_createServerFn_handler, fetchDocumentFile_createServerFn_handler, fetchProfile_createServerFn_handler, fetchWorkspace_createServerFn_handler, recordPayment_createServerFn_handler, recoverPassword_createServerFn_handler, removeTyre_createServerFn_handler, resetStaffPassword_createServerFn_handler, restoreBackup_createServerFn_handler, rotateRecovery_createServerFn_handler, saveAdjustment_createServerFn_handler, saveCompany_createServerFn_handler, saveCustomer_createServerFn_handler, saveDocument_createServerFn_handler, saveDriver_createServerFn_handler, saveExpense_createServerFn_handler, saveFuel_createServerFn_handler, saveMaintenance_createServerFn_handler, saveTrip_createServerFn_handler, saveTruck_createServerFn_handler, saveTyre_createServerFn_handler, setStaffActive_createServerFn_handler, setTripStatus_createServerFn_handler, voidInvoice_createServerFn_handler };
