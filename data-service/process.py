import os
import json
import psycopg2
import re
from dotenv import load_dotenv
from kafka import KafkaProducer
from unidecode import unidecode

load_dotenv()

SENIORIDADE_MAP = {
    "Especialista": ["specialist", "especialista"],
    "Sênior": ["senior", "sr.", "sr ", "sênior"],
    "Pleno": ["pleno", "pl.", "mid-level", "mid level", "pl "],
    "Júnior": ["junior", "jr.", "jr ", "júnior"],
    "Estágio": ["estagio", "estágio", "intern", "trainee"]
}

SKILLS_MAP = {
    # --- Backend & Linguagens ---
    "Java": ["java", "jdk", "jvm", "java 8", "java 11", "java 17", "java 21"],
    "Spring Boot": ["spring boot", "springboot", "spring-boot", "spring framework", "spring mvc", "spring data"],
    "Python": ["python", "py", "python3", "pep8"],
    "Django": ["django", "django rest framework", "drf"],
    "Flask": ["flask"],
    "FastAPI": ["fastapi", "fast api"],
    "Node.js": ["node", "node.js", "nodejs", "express", "express.js", "nest", "nestjs"],
    "C#": ["c#", "csharp", ".net", "dotnet", "asp.net", "entity framework"],
    "Go": ["go", "golang", "go lang"],
    "Ruby": ["ruby", "ruby on rails", "rails"],
    "PHP": ["php", "laravel", "symfony"],
    "Rust": ["rust", "rustlang"],

    # --- Frontend ---
    "JavaScript": ["javascript", "js", "es6", "vanilla js"],
    "TypeScript": ["typescript", "ts", "type script"],
    "React": ["react", "reactjs", "react.js", "jsx", "hooks"],
    "Angular": ["angular", "angularjs", "angular 2+"],
    "Vue.js": ["vue", "vuejs", "vue.js", "nuxt", "nuxt.js"],
    "Next.js": ["next.js", "nextjs", "next"],
    "HTML/CSS": ["html", "html5", "css", "css3", "semantic html"],
    "Tailwind CSS": ["tailwind", "tailwindcss", "tailwind css"],
    "Bootstrap": ["bootstrap"],
    "Sass/Less": ["sass", "scss", "less"],

    # --- Mobile ---
    "React Native": ["react native", "react-native"],
    "Flutter": ["flutter", "dart"],
    "Android": ["android", "kotlin", "java android"],
    "iOS": ["ios", "swift", "objective-c", "xcode"],

    # --- Banco de Dados ---
    "SQL": ["sql", "ansi sql"],
    "PostgreSQL": ["postgres", "postgresql", "pgsql"],
    "MySQL": ["mysql", "mariadb"],
    "Oracle": ["oracle db", "pl/sql", "oracle database"],
    "SQL Server": ["sql server", "mssql", "t-sql"],
    "NoSQL": ["nosql"],
    "MongoDB": ["mongo", "mongodb"],
    "Redis": ["redis", "key-value store"],
    "Cassandra": ["cassandra", "apache cassandra"],
    "Elasticsearch": ["elasticsearch", "elastic search", "elk", "kibana"],

    # --- DevOps & Cloud ---
    "AWS": ["aws", "amazon web services", "ec2", "s3", "lambda", "rds", "cloudformation"],
    "Azure": ["azure", "microsoft azure", "azure devops"],
    "GCP": ["gcp", "google cloud", "google cloud platform"],
    "Docker": ["docker", "dockerfile", "docker-compose", "container"],
    "Kubernetes": ["kubernetes", "k8s", "aks", "eks", "gke", "helm"],
    "Terraform": ["terraform", "iac", "infrastructure as code"],
    "Ansible": ["ansible"],
    "CI/CD": ["ci/cd", "ci/cd pipelines", "jenkins", "gitlab ci", "github actions", "circleci"],
    "Linux": ["linux", "bash", "shell script", "ubuntu", "centos", "unix"],

    # --- Arquitetura & Conceitos ---
    "Microserviços": ["microservicos", "microservices", "micro-servicos", "arquitetura distribuida"],
    "REST API": ["rest", "restful", "api rest", "json api"],
    "GraphQL": ["graphql"],
    "TDD": ["tdd", "test driven development", "testes unitarios", "unit tests"],
    "DDD": ["ddd", "domain driven design"],
    "SOLID": ["solid", "clean architecture", "arquitetura limpa", "clean code"],
    "Design Patterns": ["design patterns", "padroes de projeto"],
    "Mensageria": ["kafka", "rabbitmq", "activemq", "sqs", "sns", "pub/sub", "message broker"],

    # --- Dados & Analytics ---
    "Pandas": ["pandas", "dataframe"],
    "Spark": ["spark", "pyspark", "apache spark"],
    "Airflow": ["airflow", "apache airflow"],
    "Power BI": ["power bi", "powerbi", "dax"],
    "Tableau": ["tableau"],
    "Hadoop": ["hadoop", "hdfs", "mapreduce"]
}

def normaliza_texto(text):
    if not text:
        return ""
    return unidecode(text).lower()

def extrai_categoria(texto_normalizado, categoria_map):
    for categoria, palavras_chave in categoria_map.items():
        for palavra_chave in palavras_chave:
            if f" {palavra_chave} " in f" {texto_normalizado}":
                return categoria

    return "Não especificado"

def extrai_skills(texto_normalizado):
    skills = []
    for nome_skill, palavras_chave in SKILLS_MAP.items():
        for palavra_chave in palavras_chave:
            pattern = r"\b" + re.escape(palavra_chave) + r"\b"
            if re.search(pattern, texto_normalizado):
                skills.append(nome_skill)
                break
    return skills

def processa_vagas():
    conn = None
    cur = None
    producer = None
    try:
        conn = psycopg2.connect(
            host=os.getenv("POSTGRES_HOST", "localhost"),
            database=os.getenv("POSTGRES_DB", "vagas_db"),
            user=os.getenv("POSTGRES_USER"),
            password=os.getenv("POSTGRES_PASSWORD"),
            port=os.getenv("POSTGRES_PORT", "5432")
        )

        producer = KafkaProducer(
            bootstrap_servers=os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:9092"),
            value_serializer=lambda v: json.dumps(v, ensure_ascii=False).encode("utf-8"),
            key_serializer=lambda k: str(k).encode("utf-8"),
            # Aguarda confirmação do broker antes de considerar enviado
            acks=1,
            retries=3,
        )

        cur = conn.cursor()

        print("Buscando vagas não processadas...")
        cur.execute("""
            SELECT id, titulo, descricao, empresa, localizacao, url, palavra_chave, modelo
            FROM vaga_bruta
            WHERE processada = FALSE
        """)

        vagas_brutas = cur.fetchall()

        print(f"Encontrei {len(vagas_brutas)} vagas para processar.")

        for vaga in vagas_brutas:
            v_id, v_titulo, v_descricao, v_empresa, v_localizacao, v_url, v_area, v_modelo = vaga

            full_text = normaliza_texto(f"{v_titulo} {v_descricao} {v_localizacao}")
            title_text = normaliza_texto(v_titulo)

            senioridade = extrai_categoria(title_text, SENIORIDADE_MAP)
            if senioridade == "Não especificado":
                senioridade = extrai_categoria(full_text, SENIORIDADE_MAP)

            skills_encontradas = extrai_skills(full_text)

            print(f"Processando: {v_titulo} -> {senioridade} | {v_modelo} | {len(skills_encontradas)} skills")

            cur.execute("""
                INSERT INTO vaga_processada (id, titulo, empresa, localizacao, senioridade, modelo, area, url)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (id) DO NOTHING;
            """, (v_id, v_titulo, v_empresa, v_localizacao, senioridade, v_modelo, v_area, v_url))

            for skill_nome in skills_encontradas:
                skill_id = None

                cur.execute("SELECT id FROM skill WHERE nome = %s", (skill_nome,))
                resultado = cur.fetchone()

                if resultado:
                    skill_id = resultado[0]
                else:
                    cur.execute("""
                        INSERT INTO skill (id, nome)
                        VALUES (gen_random_uuid(), %s)
                        ON CONFLICT (nome) DO NOTHING;
                    """, (skill_nome,))

                    cur.execute("SELECT id FROM skill WHERE nome = %s", (skill_nome,))
                    resultado_pos_insert = cur.fetchone()

                    if resultado_pos_insert:
                        skill_id = resultado_pos_insert[0]
                    else:
                        print(f"ALERTA: Não consegui processar a skill '{skill_nome}'. Pulando.")
                        continue

                if skill_id:
                    cur.execute("""
                        INSERT INTO vaga_skill_rel (vaga_id, skill_id)
                        VALUES (%s, %s)
                        ON CONFLICT DO NOTHING;
                    """, (v_id, skill_id))

            cur.execute("UPDATE vaga_bruta SET processada = TRUE WHERE id = %s", (v_id,))
            conn.commit()

            # Publica evento para consumidores downstream (ex: MCP server para vectorização)
            evento = {
                "vagaId": str(v_id),
                "titulo": v_titulo,
                "descricao": v_descricao,
                "empresa": v_empresa,
                "localizacao": v_localizacao,
                "senioridade": senioridade,
                "modelo": v_modelo,
                "area": v_area,
                "skills": skills_encontradas,
                "url": v_url,
            }
            producer.send("vaga-processada-events", key=str(v_id), value=evento)

        producer.flush()
        print("Processamento concluído com sucesso!")

    except Exception as e:
        print(f"Erro no processamento: {e}")
        if conn:
            conn.rollback()

    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()
        if producer:
            producer.close()

if __name__ == "__main__":
    processa_vagas()
