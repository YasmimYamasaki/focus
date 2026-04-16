<?php //Corrigido

require_once __DIR__ . "/conexao.php";

class MySQLClass
{

    private $conn;

    public function __construct()
    {
        $this->conn = getConexao();
    }

    // INSERT, UPDATE, DELETE
    public function exec($sql, $params = [])
    {
        $stmt = $this->conn->prepare($sql);
        $stmt->execute($params);
        return $stmt->rowCount();
    }

    // SELECT
    public function search($sql, $params = [], $one = false)
    {
        $stmt = $this->conn->prepare($sql);
        $stmt->execute($params);

        return $one ? $stmt->fetch() : $stmt->fetchAll();
    }
}