// <author> Roscoe Moedl and Kennis Borrowman </author>
// <date>March 26th, 2025</date>

using System.Net;
using System.Net.Sockets;
using System.Runtime.Versioning;
using System.Text;

namespace GUI.Client.Controllers;

/// <summary>
/// Creates a network connection.
/// </summary>
public sealed class NetworkConnection : IDisposable
{
    /// <summary>
    ///   The connection/socket abstraction.
    /// </summary>
    private TcpClient tcpClient;

    /// <summary>
    ///   Reading end of the connection.
    /// </summary>
    private StreamReader? reader = null;

    /// <summary>
    ///   Writing end of the connection.
    /// </summary>
    private StreamWriter? writer = null;

    /// <summary>
    ///   Initializes a new instance of the <see cref="NetworkConnection"/> class.
    ///   <para>
    ///     Create a network connection object.
    ///   </para>
    /// </summary>
    /// <param name="tcpClient">
    ///   An already existing TcpClient.
    /// </param>
    public NetworkConnection(TcpClient tcpClient)
    {
        this.tcpClient = tcpClient;
        if (this.IsConnected)
        {
            // Only establish the reader/writer if the provided TcpClient is already connected.
            this.reader = new StreamReader(this.tcpClient.GetStream(), Encoding.UTF8);
            this.writer = new StreamWriter(this.tcpClient.GetStream(), new UTF8Encoding(false)) { AutoFlush = true }; // AutoFlush ensures data is sent immediately
        }
    }

    /// <summary>
    ///   Initializes a new instance of the <see cref="NetworkConnection"/> class.
    ///   <para>
    ///     Create a network connection object.  The tcpClient will be unconnected at the start.
    ///   </para>
    /// </summary>
    public NetworkConnection()
        : this(new TcpClient())
    {
    }

    /// <summary>
    /// Gets a value indicating whether the socket is connected.
    /// </summary>
    public bool IsConnected
    {
        get
        {
            return this.tcpClient.Connected;
        }
    }

    /// <summary>
    ///   Try to connect to the given host:port.
    /// </summary>
    /// <param name="host"> The URL or IP address, e.g., www.cs.utah.edu, or  127.0.0.1. </param>
    /// <param name="port"> The port, e.g., 11000. </param>
    public void Connect(string host, int port)
    {
        try
        {
            TcpClient tcpc = new();

            tcpc.Connect(host, port);

            this.reader = new StreamReader(tcpc.GetStream(), Encoding.UTF8);
            this.writer = new StreamWriter(tcpc.GetStream(), new UTF8Encoding(false)) { AutoFlush = true };

            this.tcpClient = tcpc;
        }
        catch (ArgumentOutOfRangeException)
        {
            Console.WriteLine("Client was not connected: Port number out of range.");
        }
        catch (SocketException)
        {
            Console.WriteLine("Client was not connected: Socket error occurred.");
        }
        catch (FormatException)
        {
            Console.WriteLine("Client was not connected: Format is invalid.");
        }
    }

    /// <summary>
    ///   Send a message to the remote server.  If the <paramref name="message"/> contains
    ///   new lines, these will be treated on the receiving side as multiple messages.
    ///   This method should attach a newline to the end of the <paramref name="message"/>
    ///   (by using WriteLine).
    ///   If this operation can not be completed (e.g. because this NetworkConnection is not
    ///   connected), throw an InvalidOperationException.
    /// </summary>
    /// <param name="message"> The string of characters to send. </param>
    public void Send(string message)
    {
        if (message == string.Empty)
        {
            return;
        }

        try
        {
            if (this.writer != null)
            {
                this.writer.WriteLine(message);
            }
        }
        catch
        {
            throw new InvalidOperationException();
        }
    }

    /// <summary>
    ///   Read a message from the remote side of the connection.  The message will contain
    ///   all characters up to the first new line. See <see cref="Send"/>.
    ///   If this operation can not be completed (e.g. because this NetworkConnection is not
    ///   connected), throw an InvalidOperationException.
    /// </summary>
    /// <returns> The contents of the message. </returns>
    public string ReadLine()
    {
        try
        {
            if (this.reader != null)
            {
                string? temp = this.reader.ReadLine();
                if (temp == null)
                {
                    return string.Empty;
                }
                return temp;
            }
            else
            {
                return string.Empty;
            }
        }
        catch (OutOfMemoryException)
        {
            Console.WriteLine("Out of memory");
            return string.Empty;
        }
    }

    /// <summary>
    ///   If connected, disconnect the connection and clean.
    ///   up (dispose) any streams.
    /// </summary>
    public void Disconnect()
    {
        if (this.reader != null)
        {
            this.reader.Dispose();
        }

        if (this.writer != null)
        {
            this.writer.Dispose();
        }

        this.tcpClient.Close();
    }

    /// <summary>
    ///   Automatically called with a using statement (see IDisposable).
    /// </summary>
    public void Dispose()
    {
        this.Disconnect();
    }
}
