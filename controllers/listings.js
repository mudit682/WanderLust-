const Listing = require("../models/listing");
const { listingSchema } = require("../schema");
const axios = require("axios");


module.exports.index = async(req,res)=>{
    const { category, location, search } = req.query;
    let filter = {};

    // console.log("Query Params:", req.query);
    

    if (category) {
        filter.category = new RegExp(`^${category}$`, 'i');
    }

    if (location) {
        filter.location = new RegExp(location, 'i');
    }

    if (search) {
        filter.$or = [
            { title: new RegExp(search, 'i') },
            { description: new RegExp(search, 'i') },
            { location: new RegExp(search, 'i') }
        ];
        
    }

    const allListings = await Listing.find(filter);
    res.render("listings/index.ejs", {allListings, category });
    
    

    
};

module.exports.renderNewForm = (req, res)=>{
    res.render("listings/new.ejs");
};

module.exports.showListing = async (req, res)=>{
    let {id} = req.params;
    const listing = await Listing.findById(id)
    .populate({
        path: "reviews",
        populate : {
            path: "author",
        },
    })
    .populate("owner");
    if(!listing){
        req.flash("error", "Listing you requested for does not exist!");
        res.redirect("/listings");
    }
    
    res.render("listings/show.ejs",{listing});  
};

module.exports.createListing = async(req, res, next)=>{
    let url = req.file.path;
    let filename = req.file.filename;
   
    const newListing = new Listing(req.body.listing);
    newListing.owner = req.user._id;    
    newListing.image = { url, filename };

    try {
        let response = await axios.get(`https://api.maptiler.com/geocoding/${encodeURIComponent(req.body.listing.location)}.json?key=${process.env.MAPTILER_TOKEN}`);
        if (response.data && response.data.features && response.data.features.length > 0) {
            newListing.geometry = response.data.features[0].geometry;
        } else {
            newListing.geometry = { type: "Point", coordinates: [77.2090, 28.6139] };
        }
    } catch (err) {
        console.error("Geocoding failed:", err.message);
        newListing.geometry = { type: "Point", coordinates: [77.2090, 28.6139] };
    }

    await newListing.save();
    req.flash("success", "New Listing Created!");
    res.redirect("/listings");


};

module.exports.renderEditForm = async(req, res)=>{
    let {id} = req.params;
    const listing = await Listing.findById(id);
     if(!listing){
        req.flash("error", "Listing you requested for does not exist!");
        res.redirect("/listings");
    }

    let originalImageUrl = listing.image.url;
    originalImageUrl = originalImageUrl.replace("/upload", "/upload/w_250");
    res.render("listings/edit.ejs", { listing, originalImageUrl });
};

module.exports.updateListing = async(req, res)=>{
    let {id} = req.params;
    console.log("Form Data Received:", req.body.listing);

    let listing = await Listing.findByIdAndUpdate(id, { ...req.body.listing }, {runValidators: true, new: true});
    
    if (req.body.listing.location) {
        try {
            let response = await axios.get(`https://api.maptiler.com/geocoding/${encodeURIComponent(req.body.listing.location)}.json?key=${process.env.MAPTILER_TOKEN}`);
            if (response.data && response.data.features && response.data.features.length > 0) {
                listing.geometry = response.data.features[0].geometry;
            }
        } catch (err) {
            console.error("Geocoding failed during update:", err.message);
        }
    }
   
    if( typeof req.file !== "undefined"){
        let url = req.file.path;
        let filename = req.file.filename;
        listing.image = { url, filename };
    }
    await listing.save();
    req.flash("success", "Listing Updated!");
    res.redirect(`/listings/${id}`);
};


module.exports.destroyListing = async (req, res)=>{
    let {id} = req.params;
    let deletedListing = await Listing.findByIdAndDelete(id);
    console.log(deletedListing);
    req.flash("success", "Listing Deleted!");
    res.redirect("/listings");
};