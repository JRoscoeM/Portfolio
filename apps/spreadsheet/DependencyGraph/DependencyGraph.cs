using System.Collections.Generic;
using System.ComponentModel;

namespace SpreadsheetUtilities;

/// <summary>
/// (s1,t1) is an ordered pair of strings
/// t1 depends on s1; s1 must be evaluated before t1
/// 
/// A DependencyGraph can be modeled as a set of ordered pairs of strings.  Two ordered pairs
/// (s1,t1) and (s2,t2) are considered equal if and only if s1 equals s2 and t1 equals t2.
/// Recall that sets never contain duplicates.  If an attempt is made to add an element to a 
/// set, and the element is already in the set, the set remains unchanged.
/// 
/// Given a DependencyGraph DG:
/// 
///    (1) If s is a string, the set of all strings t such that (s,t) is in DG is called dependents(s).
///        (The set of things that depend on s)    
///        
///    (2) If s is a string, the set of all strings t such that (t,s) is in DG is called dependees(s).
///        (The set of things that s depends on) 
//
// For example, suppose DG = {("a", "b"), ("a", "c"), ("b", "d"), ("d", "d")}
//     dependents("a") = {"b", "c"}
//     dependents("b") = {"d"}
//     dependents("c") = {}
//     dependents("d") = {"d"}
//     dependees("a") = {}
//     dependees("b") = {"a"}
//     dependees("c") = {"a"}
//     dependees("d") = {"b", "d"}
/// </summary>
public class DependencyGraph
{
    // fields
    private Dictionary<string, List<string>> dependents;//key is a dependee, value is a list of dependents
    private Dictionary<string, List<string>> dependees;//key is a dependent, value is a list of dependees
    int orderedPairs;

    /// <summary>
    /// Creates an empty DependencyGraph.
    /// </summary>
    public DependencyGraph()
    {
        dependents = new Dictionary<string, List<string>>();
        dependees = new Dictionary<string, List<string>>();
        orderedPairs = 0;
    }


    /// <summary>
    /// The number of ordered pairs in the DependencyGraph.
    /// This is an example of a property.
    /// </summary>
    public int NumDependencies
    {
        get { return CountDependencies(); }
    }
    /// <summary>
    /// private helper method to count the number of total dependencies
    /// </summary>
    /// <returns>the number of total dependencies</returns>
    private int CountDependencies()
    {
        int returnCount = 0;

        foreach (KeyValuePair<string, List<string>> pair in dependents)
        {
            foreach (string item in pair.Value)
            {
                returnCount++;
            }
        }

        return returnCount;
    }


    /// <summary>
    /// Returns the size of dependees(s),
    /// that is, the number of things that s depends on.
    /// </summary>
    public int NumDependees(string s)
    {
        int returnCount = 0;

        foreach (KeyValuePair<string, List<string>> pair in dependees)
        {
            if (pair.Key == s)
            {
                returnCount = pair.Value.Count;
                return returnCount;
            }
        }
        return 0;
    }


    /// <summary>
    /// Reports whether dependents(s) is non-empty.
    /// </summary>
    public bool HasDependents(string s)
    {
        List<string>? value;
        if (dependents.TryGetValue(s, out value))
        {
            return value.Count > 0;
        }
        else { return false; }
    }


    /// <summary>
    /// Reports whether dependees(s) is non-empty.
    /// </summary>
    public bool HasDependees(string s)
    {
        List<string>? value;
        if (dependees.TryGetValue(s, out value))
        {
            return value.Count > 0;
        }
        else { return false; }

    }


    /// <summary>
    /// Enumerates dependents(s).
    /// </summary>
    public IEnumerable<string> GetDependents(string s)
    {
        if (dependents.ContainsKey(s))
        {
            return new List<string>(dependents[s]);
        }
        return new List<string>();
        //List<string>? value;
        //dependents.TryGetValue(s, out value);

        //IEnumerable<string>? returnColAsEnumerable = value;

        //if(returnColAsEnumerable == null || value == null)
        //{
        //    List<string> list = new List<string>();
        //    IEnumerable<string> empty = list;
        //    return empty;
        //}

        //return returnColAsEnumerable;
    }


    /// <summary>
    /// Enumerates dependees(s).
    /// </summary>
    public IEnumerable<string> GetDependees(string s)
    {
        List<string>? value;
        dependees.TryGetValue(s, out value);

        IEnumerable<string>? returnColAsEnumerable = value;


        if (returnColAsEnumerable == null || value == null)
        {
            List<string> list = new List<string>();
            IEnumerable<string> empty = list;
            return empty;
        }

        return returnColAsEnumerable;


    }


    /// <summary>
    /// <para>Adds the ordered pair (s,t), if it doesn't exist</para>
    /// 
    /// <para>This should be thought of as:</para>   
    /// 
    ///   t depends on s
    ///   4 cases total for both dicts, 
    ///     either they contain both t and s
    ///     they contain neither t or s
    ///     they contain t but not s
    ///     they contain s but not t
    ///
    /// </summary>
    /// <param name="s"> s must be evaluated first. T depends on S</param>
    /// <param name="t"> t cannot be evaluated until s is</param>
    public void AddDependency(string s, string t)
    {
        if (dependents.ContainsKey(s) && dependees.ContainsKey(t))
        {
            return;
        }
        if (!dependents.ContainsKey(s) && !dependees.ContainsKey(t))
        {
            List<string> dependeesValue = new List<string>();
            dependeesValue.Add(s);
            List<string> dependentsValue = new List<string>();
            dependentsValue.Add(t);

            dependees.Add(t, dependeesValue);
            dependents.Add(s, dependentsValue);
            return;
        }
        if (dependents.ContainsKey(s) && !dependees.ContainsKey(t))
        {
            dependents[s].Add(t);
            List<string> dependeesValue = new List<string>();
            dependeesValue.Add(s);
            dependees.Add(t, dependeesValue);
            return;
        }
        if (!dependents.ContainsKey(s) && dependees.ContainsKey(t))
        {
            dependees[t].Add(s);
            List<string> dependentsValue = new List<string>();
            dependentsValue.Add(t);
            dependents.Add(s, dependentsValue);
            return;
        }
    }


    /// <summary>
    /// Removes the ordered pair (s,t), if it exists
    /// </summary>
    /// <param name="s"></param>
    /// <param name="t"></param>
    public void RemoveDependency(string s, string t)
    {
        if (dependents.ContainsKey(s) && dependees.ContainsKey(t))
        {
            dependents[s].Remove(t);
            dependees[t].Remove(s);
            return;
        }
        if (!dependents.ContainsKey(s) && !dependees.ContainsKey(t))
        {
            return;
        }
        if (dependents.ContainsKey(s) && !dependees.ContainsKey(t))
        {
            dependents[s].Remove(t);
            return;
        }
        if (!dependents.ContainsKey(s) && dependees.ContainsKey(t))
        {
            dependees[t].Remove(s);
            return;
        }
    }


    /// <summary>
    /// Removes all existing ordered pairs of the form (s,r).  Then, for each
    /// t in newDependents, adds the ordered pair (s,t).
    /// </summary>
    public void ReplaceDependents(string s, IEnumerable<string> newDependents)
    {

        if (dependents.ContainsKey(s))
        {
            // first remove current dependents!
            foreach (String d in dependents[s])
            {
                dependees[d].Remove(s);
                if (dependees[d].Count == 0) // edge case check if d has no values in dict
                {
                    dependees.Remove(d); // remove d itself so we can re-add the new dependents associated with s
                }
            }
            orderedPairs -= dependents[s].Count;
            dependents[s] = new List<string>(newDependents);

        }
        else
        {
            dependents.Add(s, new List<string>(newDependents));
        }

        // add new dependents to dg
        foreach (String t in dependents[s])
        {
            if (dependees.ContainsKey(t)) // if t already exists as a dependent whose dependees we want to replace
            {
                dependees[t].Add(s);
            }
            else
            {
                dependees.Add(t, new List<string>());
                dependees[t].Add(s);
            }
        }
        orderedPairs += dependents[s].Count;
        //List<string>? searchList;

        //if (dependents.TryGetValue(s, out searchList))
        //{
        //    List<string> toBeRemoved = new List<string>();
        //    foreach (string searchString in searchList)
        //    {
        //        toBeRemoved.Add(searchString);

        //    }
        //    foreach (string removeString in toBeRemoved)
        //    {
        //        searchList.Remove(removeString);
        //    }

        //}

        //foreach (string newDependent in newDependents)
        //{
        //    List<string>? list;
        //    if (dependees.TryGetValue(newDependent, out list))
        //    {
        //        list.Add(newDependent);
        //    }
        //}
    }


    /// <summary>
    /// Removes all existing ordered pairs of the form (r,s).  Then, for each 
    /// t in newDependees, adds the ordered pair (t,s).
    /// </summary>
    public void ReplaceDependees(string s, IEnumerable<string> newDependees)
    {
        if (dependees.ContainsKey(s))
        {
            // first remove current dependees!
            foreach (String d in dependees[s])
            {
                dependents[d].Remove(s);
                if (dependents[d].Count == 0)
                {
                    dependents.Remove(d);
                }
            }
            orderedPairs -= dependees[s].Count;
            dependees[s] = new List<string>(newDependees);
        }
        else
        {
            dependees.Add(s, new List<string>(newDependees));
        }

        // finally add new dependees to dg
        foreach (String t in dependees[s])
        {
            if (dependents.ContainsKey(t))
            {
                dependents[t].Add(s);
            }
            else
            {
                dependents.Add(t, new List<string>());
                dependents[t].Add(s);
            }
        }
        orderedPairs += dependees[s].Count;
        //    List<string>? searchList;

        //    if (dependees.TryGetValue(s, out searchList))
        //    {
        //        List<string> toBeRemoved = new List<string>();
        //        foreach (string searchString in searchList)
        //        {
        //            toBeRemoved.Add(searchString);
        //        }
        //        foreach (string removeString in toBeRemoved)
        //        {
        //            searchList.Remove(removeString);
        //        }
        //    }

        //    foreach (string newDependee in newDependees)
        //    {
        //        foreach(KeyValuePair<string, List<string>> pair in dependents)
        //        {
        //            if (pair.Key == newDependee)
        //            {
        //                pair.Value.Add(s);
        //            }
        //        }
        //    }
        //}
    }
}
