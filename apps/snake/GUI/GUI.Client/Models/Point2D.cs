// <author> Roscoe Moedl</author>
// <date>April 11th, 2025</date>

using System;

namespace GUI.Client.Models;

/// <summary>
/// A class to represent a 2D point in space.
/// </summary>
public class Point2D
{
    /// <summary>
    /// Initializes a new instance of the <see cref="Point2D"/> class.
    /// The default constructor for Serialization.
    /// </summary>>
    public Point2D()
    {
        this.X = 0;
        this.Y = 0;
    }

    /// <summary>
    /// Initializes a new instance of the <see cref="Point2D"/> class.
    /// </summary>
    /// <param name="x">The x coordinate of the point.</param>
    /// <param name="y">The y coordinate of the point.</param>
    public Point2D(int x, int y)
    {
        this.X = x;
        this.Y = y;
    }

    /// <summary>
    /// Gets or sets The x coordinate of the point.
    /// </summary>
    public int X { get; set; }

    /// <summary>
    /// Gets or sets The y coordinate of the point.
    /// </summary>
    public int Y { get; set; }

    /// <summary>
    /// Gets the distance in pixels between two points.
    /// </summary>
    /// <param name="first">the first point.</param>
    /// <param name="second">the second point.</param>
    /// <returns>The distance between points.</returns>
    public static int Distance(Point2D first, Point2D second)
    {
        double xes = Math.Pow(first.X - second.X, 2);
        double ys = Math.Pow(first.Y - second.Y, 2);
        return (int)Math.Sqrt(xes + ys);
    }
}
