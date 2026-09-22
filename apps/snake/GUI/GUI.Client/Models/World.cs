// <author> Roscoe Moedl</author>
// <date>April 11th, 2025</date>

using System;
using System.Drawing;

namespace GUI.Client.Models;

/// <summary>
/// Class which represents the entirety of the game world.
/// </summary>
public class World
{
    /// <summary>
    /// Initializes a new instance of the <see cref="World"/> class.
    /// </summary>
    /// <param name="size">The size of the world.</param>
    public World(int size)
    {
        this.Snakes = new();
        this.Powerups = new();
        this.Walls = new();
        this.Size = size;
        this.Width = size;
        this.Height = size;
    }

    /// <summary>
    /// Initializes a new instance of the <see cref="World"/> class.
    /// Shallow copy constructor.
    /// </summary>
    /// <param name="world">the world to copy.</param>
    public World(World world)
    {
        this.Snakes = new(world.Snakes);
        this.Powerups = new(world.Powerups);
        this.Walls = new(world.Walls);
        this.Size = world.Size;
        this.Width = world.Size;
        this.Height = world.Size;
    }

    /// <summary>
    /// Noting that each instance of a 
    /// </summary>
    public int GameId { get; private set; }

    /// <summary>
    /// Gets or sets A Dictionary which holds the mappings of all snake IDs to Snake objects.
    /// </summary>
    public Dictionary<int, Snake> Snakes { get; set; }

    /// <summary>
    /// Gets or sets a A Dictionary which holds the mappings of all powerup IDs to powerup objects.
    /// </summary>
    public Dictionary<int, Powerup> Powerups { get; set; }

    /// <summary>
    /// Gets or sets the A Dictionary which holds the mappings of all wall IDs to wall objects.
    /// </summary>
    public Dictionary<int, Wall> Walls { get; set; }

    /// <summary>
    /// Gets or sets the size of the world.
    /// </summary>
    public int Size { get; set; }

    /// <summary>
    /// Gets the width of the world.
    /// </summary>
    public int Width { get; private set; }

    /// <summary>
    /// Gets the height of the world.
    /// </summary>
    public int Height { get; private set; }
}
