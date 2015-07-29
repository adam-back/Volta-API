//Is it currently DST at each location?
module.exports = {
	// PDT: true,
	// PST: false,
	// HADT: true, //This would be Alaska in DST, NOT Hawaii
	// HAST: false, //Hawaii is always HAST, NEVER MDT
	// HST: false,
	// MDT: true,
	// MST: false, //Arizona is always MST, NEVER MDT
	// CDT: true,
	// CST: false,

	Arizona: false, //Never has DST
  Chicago: true,
  Hawaii: false, //Never has DST
  LA: true,
  NoCal: true,
  OC: true,
  SD: true
};

//When one of these is changed
//  find all stations in the database of that network
//  and update their time by one hour
//    if true, -1
//    if false, +1