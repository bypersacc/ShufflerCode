/* This file uses functions from the util.js file */

function onCalculateTimeClick()
{
	const startTime = document.getElementById("startTimeInput").value;
	const endTime = document.getElementById("endTimeInput").value;
	const breakDuration = document.getElementById("breakDurationInput").value;
	
	function toJSDate(inputValue)
	{
		const date = new Date();
		date.setHours(inputValue.split(':')[0]);
		date.setMinutes(inputValue.split(':')[1]);
		
		return date;
	}
	
	//TODO: validation
	
	//Calculate -- take two dates, take difference in hours, then subtract break length
	const startDate = toJSDate(startTime);
	const endDate = toJSDate(endTime);
	const breakDurationHours = breakDuration;

	const differenceMilliseconds = endDate.getTime() - startDate.getTime();
	const differenceMinutes = Math.floor(differenceMilliseconds / 60000); //Math.floor called to eliminate floating-point imprecision from integer value
	const differenceHours = differenceMinutes / 60;
	const workTime = differenceHours - breakDurationHours;
	
	//Display result
	const displayValue = `${workTime} hours`;
	
	function toDisplaySpan(value)
	{
		const span = '<span ' + `style="font-size: 150%;">${value}` + '</span>';
		return span;
	}
	
	document.getElementById("resultText").innerHTML = toDisplaySpan(displayValue);
}

console.log('time calc functions loaded');