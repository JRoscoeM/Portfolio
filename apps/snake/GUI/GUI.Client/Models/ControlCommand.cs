// <author> Roscoe Moedl</author>
// <date>April 11th, 2025</date>

namespace GUI.Client.Models
{
    /// <summary>
    /// Represents what command the user sent to the server.
    /// </summary>
    public class ControlCommand
    {
        /// <summary>
        /// Initializes a new instance of the <see cref="ControlCommand"/> class.
        /// Default constructor.
        /// </summary>
        public ControlCommand()
        {
            this.Moving = "none";
        }

        /// <summary>
        /// Initializes a new instance of the <see cref="ControlCommand"/> class.
        /// </summary>
        /// <param name="dir">The direction to move in.</param>
        public ControlCommand(string dir)
        {
            this.Moving = dir;
        }

        /// <summary>
        /// Gets or sets a string representing which direction the user is moving.
        /// </summary>
        public string Moving { get; set; }
    }
}
