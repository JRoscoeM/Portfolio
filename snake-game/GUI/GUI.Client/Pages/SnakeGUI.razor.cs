// <author> Roscoe Moedl and Kennis Borrowman </author>
// <date>April 11th 2025, 2025</date>

using Blazor.Extensions;
using Blazor.Extensions.Canvas.Canvas2D;
using GUI.Client.Controllers;
using GUI.Client.Models;
using Microsoft.AspNetCore.Components;
using Microsoft.JSInterop;

namespace GUI.Client.Pages
{
    /// <summary>
    /// Partial class for SnakeGUI.razor.
    /// </summary>
    public partial class SnakeGUI : ComponentBase
    {
        /// <summary>
        /// Height of the display canvas.
        /// </summary>
        private const int ViewHeight = 1000;

        /// <summary>
        /// Width of the display canvas.
        /// </summary>
        private const int ViewWidth = 1000;

        /// <summary>
        /// The size of one side of the square world.
        /// </summary>
        private const int WorldSize = 2000;

        /// <summary>
        /// The (M)odel part of MVC, represents the objects in the game.
        /// </summary>
        private World theWorld = new(WorldSize);

        /// <summary>
        /// C# reference to the html element for the drawing canvas.
        /// </summary>
        private BECanvasComponent canvasReference = null!;

        /// <summary>
        /// Reference to the input box for name.
        /// </summary>
        private ElementReference usernameTextbox;

        /// <summary>
        /// C# reference to the html element for the background image (lab 11).
        /// </summary>
        private ElementReference backgroundImage;

        /// <summary>
        /// C# reference to the html element for the background image (lab 11).
        /// </summary>
        private ElementReference wallImage;

        /// <summary>
        /// Reference to the button a user clicks to get rid of error.
        /// </summary>
        private ElementReference errorButton;

        /// <summary>
        /// The name which is currently input by the user.
        /// </summary>
        private string currentName = string.Empty;

        /// <summary>
        /// The network Controller.
        /// </summary>
        private NetworkController? controller;

        /// <summary>
        /// The current connection.
        /// </summary>
        private NetworkConnection? connection;

        /// <summary>
        /// Message to display to the user if connection failed.
        /// </summary>
        private string errorMessage = string.Empty;

        /// <summary>
        /// Member variable used for whether the warning message should be displayed.
        /// </summary>
        private bool showWarning = false;

        /// <summary>
        /// The width of the snake.
        /// </summary>
        private int snakeWidth = 10;

        /// <summary>
        /// The Canvas context.
        /// </summary>
        private Canvas2DContext context = null!;

        /// <summary>
        /// The IJS object reference.
        /// </summary>
        private IJSObjectReference jsModule = null!;

        /// <summary>
        /// The portNumber. Made a member variable so that the View can display it.
        /// </summary>
        private int portNumber;

        /// <summary>
        /// Gets whether a warning message is active or inactive.
        /// </summary>
        private string PopupClass => this.showWarning ? "active" : "inactive";

        /// <summary>
        /// Handles when the user presses a key to change directions.
        /// </summary>
        /// <param name="key">the key the user pressed.</param>
        [JSInvokable]
        public void HandleKeyPress(string key)
        {
            if (this.controller != null)
            {
                switch (key)
                {
                    case "w":
                        this.controller.ChangeDirection("up");
                        break;
                    case "a":
                        this.controller.ChangeDirection("left");
                        break;
                    case "s":
                        this.controller.ChangeDirection("down");
                        break;
                    case "d":
                        this.controller.ChangeDirection("right");
                        break;
                }
            }
        }

        /// <summary>
        /// Automatically runs and builds the gui on the first render.
        /// </summary>
        /// <param name="firstRender">if this is the first render or not.</param>
        /// <returns><see cref="Task"/> representing the asynchronous operation.</returns>
        protected override async Task OnAfterRenderAsync(bool firstRender)
        {
            if (firstRender)
            {
                this.jsModule = await this.JsRuntime.InvokeAsync<IJSObjectReference>("import", "./Pages/SnakeGUI.razor.js");
                this.context = await this.canvasReference.CreateCanvas2DAsync();
                await this.JsRuntime.InvokeAsync<object>("initRenderJS", DotNetObjectReference.Create(this));
            }
        }

        /// <summary>
        /// Helper to change value of showWarning if necessary.
        /// </summary>
        private void ToggleWarning(bool b)
        {
            this.showWarning = b;
            this.StateHasChanged();
        }

        /// <summary>
        /// Handle when the user inputs their name.
        /// </summary>
        private void HandleName(ChangeEventArgs e)
        {
            if (e.Value != null)
            {
                this.currentName = (string)e.Value;
            }
        }

        /// <summary>
        /// setup ncontroller and NetworkConnection.
        /// </summary>
        private void RequestConnection()
        {
            // If the client is already connected then refuse a request to connect again.
            if (this.connection != null && this.connection.IsConnected)
            {
                return;
            }
            try
            {
                this.portNumber = 11_000;

                // Initialize the controller
                this.controller = new(this.theWorld);

                // Create a new NetworkConnection object, connect it, and send the name on that connection.
                this.connection = new();
                this.connection.Connect("localhost", this.portNumber);

                this.connection.Send(this.currentName);

                // Send the work of reading from the server to a new thread.
                new Thread(() => this.controller.HandleConnect(this.connection)).Start();

                this.GameLoop();

                if (this.showWarning)
                {
                    this.ToggleWarning(false);
                }

            }
            catch
            {
                this.ToggleWarning(true);
                this.errorMessage = "There was a problem connecting. Please make sure that the server is running and try again.";
            }
        }

        /// <summary>
        /// Requests a disconnection.
        /// </summary>
        private void RequestDisconnection()
        {
            if (this.controller != null)
            {
                this.controller.SetDisconnect();
            }
        }

        /// <summary>
        /// Renders the view once every 20 milliseconds (50 frames/second).
        /// </summary>
        private async void GameLoop()
        {
            while (true)
            {
                Thread.Sleep(20);
                await this.DrawFrame();
            }
        }

        /// <summary>
        /// Draws one frame of the game.
        /// </summary>
        private async Task DrawFrame()
        {
            if (this.theWorld == null)
            {
                return;
            }
            World worldCopy;
            lock (this.theWorld)
            {
                worldCopy = new World(this.theWorld);
            }

            // batch the drawing calls for better performance
            await this.context.BeginBatchAsync();
            await this.context.FillRectAsync(0, 0, ViewWidth, ViewHeight);

            // clip the view so that objects drawn outside the canvas will not be shown
            await this.context.BeginPathAsync();
            await this.context.RectAsync(0, 0, ViewWidth, ViewHeight);
            await this.context.ClipAsync();

            // Because we are modifying the transformation matrix, we need to save it so we can restore it at the end
            await this.context.SaveAsync();

            // Center on origin, move to center of view port
            await this.context.TranslateAsync(ViewWidth / 2, ViewHeight / 2);

            // If everything has been connected, data has been received, and the world contains that snake.
            if (this.controller != null && worldCopy.Snakes.Count > 0 && worldCopy.Snakes.ContainsKey(this.controller.PlayerId))
            {
                // Center view on snake head
                await this.context.TranslateAsync(-worldCopy.Snakes[this.controller.PlayerId].GetBody().Last().X, -worldCopy.Snakes[this.controller.PlayerId].GetBody().Last().Y);
            }

            // Draw the background:
            await this.context.DrawImageAsync(this.backgroundImage, -worldCopy.Width / 2, -worldCopy.Height / 2, worldCopy.Width, worldCopy.Height);


            // Draw the objects:
            await this.DrawWall(worldCopy);
            await this.DrawSnake(worldCopy);
            await this.DrawPowerup(worldCopy);

            await this.context.RestoreAsync();

            // finish batch drawing
            await this.context.EndBatchAsync();

            this.StateHasChanged(); // Components (microsoft) method
        }

        /// <summary>
        /// Creates a color based on the modulo of the snakes ID.
        /// </summary>
        /// <param name="id">the id of the snake.</param>
        /// <returns>A color based on the id.</returns>
        private string SetColor(int id)
        {
            string color = string.Empty;
            switch (id % 10)
            {
                case 0:
                    color = "rgb(255, 20, 147)";
                    break;
                case 1:
                    color = "rgb(0, 0, 0)";
                    break;
                case 2:
                    color = "rgb(255, 0, 0)";
                    break;
                case 3:
                    color = "rgb(0, 255 , 0)";
                    break;
                case 4:
                    color = "rgb(0, 0, 255)";
                    break;
                case 5:
                    color = "rgb(255, 255, 0)";
                    break;
                case 6:
                    color = "rgb(0, 255, 255)";
                    break;
                case 7:
                    color = "rgb(160, 32, 240)";
                    break;
                case 8:
                    color = "rgb(255, 99, 71)";
                    break;
                case 9:
                    color = "rgb(127, 96, 212)";
                    break;
            }

            return color;
        }

        /// <summary>
        /// Draws all the snakes in the world.
        /// </summary>
        /// <param name="worldCopy">A copy of the world.</param>
        /// <returns>A task.</returns>
        private async Task DrawSnake(World worldCopy)
        {
            foreach (Snake s in worldCopy.Snakes.Values)
            {
                // If the snake is marked as disconnected then remove that snake from the world
                if (s.GetDC())
                {
                    this.theWorld.Snakes.Remove(s.GetID());
                }

                // set the color of the snake based on its ID
                await this.context.SetFillStyleAsync(this.SetColor(s.GetID()));

                // draw the snake
                for (int i = 0; i < s.GetBody().Count - 1; i++)
                {
                    Point2D p1 = s.GetBody().ElementAt(i);
                    Point2D p2 = s.GetBody().ElementAt(i + 1);
                    int distance = Point2D.Distance(p1, p2);
                    int snakeRadius = (int)(this.snakeWidth / 2);

                    // if its the first or last Point in the snake
                    if (i == 0 || i == s.GetBody().Count - 2)
                    {
                        await this.context.BeginPathAsync();
                        await this.context.ArcAsync(p1.X, p1.Y, this.snakeWidth / 2, 0, 2 * Math.PI);
                        await this.context.ArcAsync(p2.X, p2.Y, this.snakeWidth / 2, 0, 2 * Math.PI);
                        await this.context.FillAsync();
                    }

                    // vertical
                    if (p1.X == p2.X)
                    {
                        // down
                        if (p1.Y < p2.Y)
                        {
                            await this.context.BeginPathAsync();
                            await this.context.FillRectAsync(p1.X - snakeRadius, p1.Y, this.snakeWidth, distance);
                        }

                        // up
                        else
                        {
                            await this.context.BeginPathAsync();
                            await this.context.FillRectAsync(p2.X - snakeRadius, p2.Y, this.snakeWidth, distance);
                        }
                    }

                    // horizontal
                    if (p1.Y == p2.Y)
                    {
                        // left
                        if (p1.X > p2.X)
                        {
                            await this.context.BeginPathAsync();
                            await this.context.FillRectAsync(p2.X, p2.Y - snakeRadius, distance, this.snakeWidth);
                        }

                        // right
                        else
                        {
                            await this.context.BeginPathAsync();
                            await this.context.FillRectAsync(p1.X, p1.Y - snakeRadius, distance, this.snakeWidth);
                        }
                    }

                    if (i == s.GetBody().Count - 2)
                    {
                        // draw the name and score of the client at the head of the snake.
                        await this.context.SetFillStyleAsync("rgb(255, 255, 255)");
                        await this.context.SetFontAsync("18px serif");
                        await this.context.FillTextAsync(s.GetName(), p2.X, p2.Y);
                        await this.context.FillTextAsync("score: " + s.GetScore().ToString(), p2.X, p2.Y + 14);
                    }
                }
            }
        }

        /// <summary>
        /// Draws all the walls in the world.
        /// </summary>
        /// <param name="worldCopy">A copy of the world.</param>
        /// <returns>a Task.</returns>
        private async Task DrawWall(World worldCopy)
        {
            if (worldCopy.Snakes.Count > 0)
            {
                await this.context.DrawImageAsync(this.wallImage, 0, 0);
            }

            foreach (Wall w in worldCopy.Walls.Values)
            {
                Point2D p1 = w.GetP1();
                Point2D p2 = w.GetP2();

                // If drawing vertically
                if (p1.X == p2.X)
                {
                    int start = Math.Min(p1.Y, p2.Y) - 25;
                    int end = Math.Max(p1.Y, p2.Y) - 25;
                    while (start <= end)
                    {
                        await this.context.DrawImageAsync(this.wallImage, p1.X - 25, start);
                        start += 50;
                    }
                }

                // if drawing horizontally
                else
                {
                    int start = Math.Min(p1.X, p2.X) - 25;
                    int end = Math.Max(p1.X, p2.X) - 25;
                    while (start <= end)
                    {
                        await this.context.DrawImageAsync(this.wallImage, start, p1.Y - 25);
                        start += 50;
                    }
                }
            }
        }

        /// <summary>
        /// Draws all the powerups in the world.
        /// </summary>
        /// <param name="worldCopy">A copy of the world.</param>
        /// <returns>A Task.</returns>
        private async Task DrawPowerup(World worldCopy)
        {
            foreach (Powerup p in worldCopy.Powerups.Values)
            {
                // smaller yellow circle for powerups
                await this.context.FillAsync();
                await this.context.SetFillStyleAsync($"rgb( 255, 255, 0 )");
                await this.context.BeginPathAsync();
                await this.context.ArcAsync(p.GetLoc().X, p.GetLoc().Y, 8, 0, 2 * Math.PI);
            }
        }
    }
}