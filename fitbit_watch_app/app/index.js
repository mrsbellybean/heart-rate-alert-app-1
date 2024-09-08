//import { BodyPresenceSensor } from "body-presence";
import { me as appbit } from "appbit";
import { HeartRateSensor } from "heart-rate";
import document from "document";

function myFunction(){
	let hrmData = document.getElementById("hrm-data");
	if (HeartRateSensor && appbit.permissions.granted("access_heart_rate")) {
		let hrm = new HeartRateSensor({ frequency: 1 });
		hrm.start();
		hrm.onreading = () => {
			hrmData.text = `${hrm.heartRate}`;
		}
		document.onunload = () => {
			hrm.stop();
		};
	}
	else {
		hrmData.text = "No heart rate data";
	}
}

/*
if (BodyPresenceSensor) {
	const body = new BodyPresenceSensor();
	body.addEventListener("reading", () => {
		if (!body.present) {
			hrm.stop();
		} else {
			hrm.start();
		}
	});
	body.start();
}
//url to push information
//add in recalls
*/
myFunction();
