

const myGlobalFunction = (message) => {
  try {
    console.log("Global Function Message:", message);

  } catch (error) {
    console.error("Error in myGlobalFunction:", error);
  }
};

module.exports = { myGlobalFunction };
