// <author> Kennis Borrowman and Roscoe Moedl</author>
// <date>April 11th, 2025</date>

using System;
using System.Net;
using System.Text.Json.Serialization;

namespace GUI.Client.Models;

/// <summary>
/// A class which represents an single unit of the walls.
/// </summary>
public class Wall
{
    /// <summary>
    /// Gets or sets an int representing the wall's unique ID.
    /// </summary>
    [JsonInclude]
    private int wall;

    /// <summary>
    /// A Point2D representing one endpoint of the wall.
    /// </summary>
    [JsonInclude]
    private Point2D p1;

    /// <summary>
    /// A Point2D representing the other endpoint of the wall.
    /// </summary>
    [JsonInclude]
    private Point2D p2;

    /// <summary>
    /// Initializes a new instance of the <see cref="Wall"/> class.
    /// Default constructor.
    /// </summary>
    public Wall()
    {
        this.p1 = new();
        this.p2 = new();
        this.wall = 0;
    }

    /// <summary>
    /// Initializes a new instance of the <see cref="Wall"/> class.
    /// </summary>
    /// <param name="firstPoint">The first endpoint of the wall.</param>
    /// <param name="secondPoint">The second endpoint of the wall.</param>
    /// <param name="id">The id of the wall.</param>
    public Wall(Point2D firstPoint, Point2D secondPoint, int id)
    {
        this.p1 = firstPoint;
        this.p2 = secondPoint;
        this.wall = id;
    }

    /// <summary>
    /// Gets the value of the wall id.
    /// </summary>
    /// <returns>an int that represents the id.</returns>
    public int GetID()
    {
        return this.wall;
    }

    /// <summary>
    /// Gets the value of the walls First point.
    /// </summary>
    /// <returns>The Walls first endpoint.</returns>
    public Point2D GetP1()
    {
        return this.p1;
    }

    /// <summary>
    /// Gets the value of the walls second point.
    /// </summary>
    /// <returns>The Walls second endpoint.</returns>
    public Point2D GetP2()
    {
        return this.p2;
    }
}
