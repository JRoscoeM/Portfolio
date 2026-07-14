
window.initRenderJS = (instance) => {
    window.theInstance = instance;
};

document.addEventListener('keydown', function (event)
{
    // Call the C# method and pass the key pressed
    theInstance.invokeMethodAsync('HandleKeyPress', event.key);

});
