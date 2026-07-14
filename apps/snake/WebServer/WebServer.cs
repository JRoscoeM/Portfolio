// <author> Roscoe Moedl</author>
// <date>April 14th 2025, 2025</date>

using System.Net;
using System.Net.Sockets;
using GUI.Client.Controllers;
using MySql.Data.MySqlClient;

namespace Webserver;

/// <summary>
/// This class represents a web server which is used to retrieve scores data from
/// the database and send that data in the form of an HTML page to the client.
/// </summary>
public static class WebServer
{
    /// <summary>
    /// The connection string.
    /// </summary>
    private static readonly string ConnectionString =
        Environment.GetEnvironmentVariable("SNAKE_MYSQL_CONNECTION_STRING")
        ?? throw new InvalidOperationException(
            "Set SNAKE_MYSQL_CONNECTION_STRING before starting the legacy score server.");

    /// <summary>
    /// The header string that indicates everything was OK.
    /// </summary>
    private const string HttpOkHeader =
        "HTTP/1.1 200 OK\r\n" +
        "Connection: close\r\n" +
        "Content-Type: text/html\r\n; charset=UTF-8\r\n" +
        "\r\n";

    /// <summary>
    /// The header string that indicates the page was not found.
    /// </summary>
    private const string HttpBadHeader =
        "HTTP/1.1 404 Not Found\r\n" +
        "Connection: close\r\n" +
        "Content-Type: text/html; charset=UTF-8\r\n" +
        "\r\n";

    /// <summary>
    /// The start of the program.
    /// </summary>
    /// <param name="args"> ignored. </param>
    public static void Main(string[] args)
    {
        StartServer(HandleConnect, 80);
        Console.Read(); // don't stop the program.
    }

    /// <summary>
    ///   Wait on a TcpListener for new connections. Alert the main program
    ///   via a callback (delegate) mechanism.
    /// </summary>
    /// <param name="handleConnect">
    ///   Handler for what the user wants to do when a connection is made.
    ///   This should be run asynchronously via a new thread.
    /// </param>
    /// <param name="port"> The port (e.g., 11000) to listen on. </param>
    public static void StartServer(Action<NetworkConnection> handleConnect, int port)
    {
        TcpListener tcpListener = new(IPAddress.Any, port);
        tcpListener.Start();
        while (true)
        {
            TcpClient clientSocket = tcpListener.AcceptTcpClient();
            new Thread(() => handleConnect(new NetworkConnection(clientSocket))).Start();
        }
    }

    /// <summary>
    /// Handles the connection to the client. This method will query the database for 
    /// the game data and return it in the form of an HTML page. The page will be sent via
    /// the NetworkConnection object.
    /// </summary>
    /// <param name="connection">The NetworkConnection between this WebServer and the client.</param>
    private static void HandleConnect(NetworkConnection connection)
    {
        // receive the request.
        string receivedLine = connection.ReadLine();

        // client requested the individual game page
        if (receivedLine.Contains("GET /games?gid="))
        {
            string gameId = string.Empty;
            for (int i = 15; int.TryParse(receivedLine[i].ToString(), out _); i++)
            {
                gameId += receivedLine[i];
            }

            string response =
                "<html>" +
                    "<h3>Stats for Game " +
                    gameId +
                    "</h3>" +
                    "<table border=\"1\">" +
                        "<thead>" +
                            "<tr>" +
                                "<td>Player ID</td><td>Player Name</td><td>Max Score</td><td>Enter Time</td><td>Leave Time</td>" +
                            "</tr>" +
                        "</thead>" +
                        "<tbody>";
            using (MySqlConnection conn = new MySqlConnection(ConnectionString))
            {
                conn.Open();

                MySqlCommand cmd = conn.CreateCommand();
                cmd.CommandText = "select * from Players where ForeignKey = " + gameId;

                // append the appropriate data as html table data entries in string form
                using (MySqlDataReader reader = cmd.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        response += "<tr>";
                        response += "<td>" + reader[0] + "</td>";
                        response += "<td>'" + reader[2] + "'</td>";
                        response += "<td>" + reader[3] + "</td>";
                        response += "<td>'" + reader[4] + "'</td>";
                        response += "<td>'" + reader[5] + "'</td>";
                        response += "</tr>";
                    }
                }
            }

            response +=
                        "</tbody>" +
                    "</table>" +
                "</html>";
            connection.Send(HttpOkHeader + response);
        }

        // client requested the directory of games
        else if (receivedLine.Contains("GET /games"))
        {
            string response =
                "<html>" +
                    "<table border=\"1\">    " +
                        "<thead>" +
                            "<tr> " +
                                "<td>ID</td><td>Start</td><td>End</td>      " +
                            "</tr>" +
                        "</thead>" +
                        "<tbody>" +
                            "<tr>";
            // append the appropriate data as html table data entries in string form
            using (MySqlConnection conn = new MySqlConnection(ConnectionString))
            {
                conn.Open();

                MySqlCommand cmd = conn.CreateCommand();
                cmd.CommandText = "select * from Games";

                // Execute the command and cycle through the DataReader object
                using (MySqlDataReader reader = cmd.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        response += "<tr>";
                        response += "<td><a href=\"/games?gid=" + reader[0] + "\">" + reader[0] + "</a></td>";
                        response += "<td>" + reader[1] + "</td>";
                        response += "<td>" + reader[2] + "</td>";
                        response += "</tr>";
                    }
                }
            }

            response +=
                            "</tr>" +
                        "</tbody>  " +
                    "</table>" +
                "</html>";
            connection.Send(HttpOkHeader + response);
        }

        // client requested the Home page
        else if (receivedLine.Contains("GET /"))
        {
            string response =
                "<html>" +
                    "<h3>Welcome to the Snake Games Database!</h3>" +
                    "<a href=\"/games\">" +
                        "View Games" +
                    "</a>" +
                "</html>";
            connection.Send(HttpOkHeader + response);
        }
        else
        {
            // server not found page.
            connection.Send(HttpBadHeader);
        }

        // always disconnect
        connection.Disconnect();
    }
}
